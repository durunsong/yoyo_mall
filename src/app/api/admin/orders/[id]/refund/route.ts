import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRefund } from '@/lib/stripe';
import { getRefundMinorUnits } from '@/lib/payments/refund';
import { toStripeMinorUnits } from '@/lib/payments/stripe-transition';

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z
    .enum(['duplicate', 'fraudulent', 'requested_by_customer'])
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function ensureAdmin() {
  const session = await auth();
  return session?.user?.id &&
    ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role ?? '')
    ? session
    : null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await ensureAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = refundSchema.parse(await request.json().catch(() => ({})));
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: id,
        provider: 'stripe',
        status: 'COMPLETED',
        providerTransactionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment?.providerTransactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_NOT_REFUNDABLE',
          message: '没有可退款的已完成Stripe支付',
        },
        { status: 409 },
      );
    }

    const existingMetadata =
      typeof payment.metadata === 'object' &&
      payment.metadata !== null &&
      !Array.isArray(payment.metadata)
        ? payment.metadata
        : {};
    const refundedMinorUnits =
      typeof existingMetadata.refundedAmount === 'number'
        ? existingMetadata.refundedAmount
        : 0;
    const totalMinorUnits = toStripeMinorUnits(
      Number(payment.amount),
      payment.currency,
    );
    const amountInMinorUnits = getRefundMinorUnits(
      body.amount,
      totalMinorUnits,
      refundedMinorUnits,
      payment.currency,
    );
    const refundResult = await createRefund({
      paymentIntentId: payment.providerTransactionId,
      amountInMinorUnits,
      reason: body.reason,
      currency: payment.currency,
      idempotencyKey: `refund:${payment.id}:${amountInMinorUnits}`,
      metadata: { orderId: id, adminId: session.user.id },
    });

    if (!refundResult.success || !refundResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'REFUND_FAILED',
          message: refundResult.error ?? '退款失败',
        },
        { status: 502 },
      );
    }

    const refundedTotal = refundedMinorUnits + refundResult.data.amount;
    const fullyRefunded =
      refundResult.data.status === 'succeeded' &&
      refundedTotal >= totalMinorUnits;
    await prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          ...(fullyRefunded ? { status: 'REFUNDED' } : {}),
          metadata: {
            ...existingMetadata,
            refundedAmount: refundedTotal,
            lastRefundId: refundResult.data!.id,
            refundStatus: refundResult.data!.status,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      if (fullyRefunded) {
        await tx.order.update({ where: { id }, data: { status: 'REFUNDED' } });
      }
    });

    return NextResponse.json({
      success: true,
      message: fullyRefunded
        ? '退款成功，订单已标记为已退款'
        : '退款请求已提交',
      data: {
        ...refundResult.data,
        fullyRefunded,
        refundedAmount: refundedTotal,
        currency: payment.currency,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '退款参数无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }
    if (
      error instanceof Error &&
      (error.message === '退款金额必须大于0' ||
        error.message === '退款金额超过可退金额')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REFUND_AMOUNT',
          message: error.message,
        },
        { status: 400 },
      );
    }
    console.error('管理员退款失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '退款失败' },
      { status: 500 },
    );
  }
}
