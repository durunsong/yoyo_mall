import { Prisma } from '@prisma/client';
import type { PaymentStatus } from '@prisma/client';
import {
  isPaymentIntentAmountMatching,
  resolveStripePaymentTransition,
} from './stripe-transition';

type TransactionClient = Prisma.TransactionClient;

export class StripePaymentTransitionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'PAYMENT_NOT_FOUND'
      | 'AMOUNT_MISMATCH'
      | 'INVENTORY_CONFLICT',
  ) {
    super(message);
    this.name = 'StripePaymentTransitionError';
  }
}

const isJsonObject = (
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export async function applyStripePaymentTransition(
  tx: TransactionClient,
  {
    paymentIntentId,
    eventType,
    stripeStatus,
    stripeAmountInMinorUnits,
    stripeCurrency,
    lastPaymentError,
    paymentId,
  }: {
    paymentIntentId: string;
    eventType: string;
    stripeStatus: string;
    stripeAmountInMinorUnits: number;
    stripeCurrency: string;
    lastPaymentError?: string;
    paymentId?: string;
  },
) {
  const payment = await tx.payment.findFirst({
    where: {
      providerTransactionId: paymentIntentId,
      ...(paymentId ? { id: paymentId } : {}),
    },
    include: {
      order: {
        include: {
          items: {
            include: { product: { select: { trackInventory: true } } },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new StripePaymentTransitionError(
      '支付记录不存在',
      'PAYMENT_NOT_FOUND',
    );
  }

  if (
    !isPaymentIntentAmountMatching({
      stripeAmountInMinorUnits,
      storedAmount: Number(payment.amount),
      stripeCurrency,
      storedCurrency: payment.currency,
    })
  ) {
    throw new StripePaymentTransitionError(
      'Stripe支付金额或币种与订单不匹配',
      'AMOUNT_MISMATCH',
    );
  }

  const transition = resolveStripePaymentTransition(eventType, stripeStatus);
  const existingMetadata = isJsonObject(payment.metadata)
    ? payment.metadata
    : {};
  const metadata: Prisma.InputJsonObject = {
    ...existingMetadata,
    stripeStatus,
    updatedAt: new Date().toISOString(),
    ...(transition.paymentStatus === 'COMPLETED'
      ? { completedAt: new Date().toISOString() }
      : {}),
    ...(transition.paymentStatus === 'FAILED'
      ? {
          failedAt: new Date().toISOString(),
          lastError: lastPaymentError ?? 'Unknown error',
        }
      : {}),
    ...(transition.paymentStatus === 'CANCELLED'
      ? { canceledAt: new Date().toISOString() }
      : {}),
  };

  // The status predicate makes this transition idempotent under retries and concurrent requests.
  const update = await tx.payment.updateMany({
    where: {
      id: payment.id,
      status: { in: ['PENDING', 'PROCESSING'] as PaymentStatus[] },
    },
    data: { status: transition.paymentStatus, metadata },
  });

  if (update.count > 0) {
    await tx.order.updateMany({
      where: {
        id: payment.orderId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      data: { status: transition.orderStatus },
    });

    if (transition.inventoryAction !== 'NONE') {
      for (const item of payment.order.items) {
        if (!item.product?.trackInventory || !item.productId) continue;

        const where = item.variantId
          ? { variantId: item.variantId }
          : { productId: item.productId };
        const inventory = await tx.inventory.updateMany({
          where: {
            ...where,
            ...(transition.inventoryAction === 'COMMIT'
              ? {
                  quantity: { gte: item.quantity },
                  reservedQuantity: { gte: item.quantity },
                }
              : { reservedQuantity: { gte: item.quantity } }),
          },
          data:
            transition.inventoryAction === 'COMMIT'
              ? {
                  quantity: { decrement: item.quantity },
                  reservedQuantity: { decrement: item.quantity },
                }
              : { reservedQuantity: { decrement: item.quantity } },
        });

        if (inventory.count !== 1) {
          throw new StripePaymentTransitionError(
            '库存状态冲突，支付状态未完成',
            'INVENTORY_CONFLICT',
          );
        }
      }
    }

    if (transition.paymentStatus === 'COMPLETED' && payment.order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: payment.order.couponCode },
        data: { usageCount: { increment: 1 } },
      });
    }
  }

  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    paymentStatus: transition.paymentStatus,
    orderStatus: transition.orderStatus,
    inventoryAction: update.count > 0 ? transition.inventoryAction : 'NONE',
    firstApplied: update.count > 0,
  };
}
