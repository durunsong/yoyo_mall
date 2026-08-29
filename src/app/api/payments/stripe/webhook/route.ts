import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/stripe';
import {
  applyStripePaymentTransition,
  StripePaymentTransitionError,
} from '@/lib/payments/apply-stripe-transition';

const PAYMENT_INTENT_EVENTS = new Set([
  'payment_intent.succeeded',
  'payment_intent.processing',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_intent.requires_action',
  'payment_intent.requires_payment_method',
  'payment_intent.requires_confirmation',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature)
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 },
      );
    }

    const verificationResult = verifyWebhookSignature(
      body,
      signature,
      webhookSecret,
    );
    if (!verificationResult.success || !verificationResult.data) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = verificationResult.data;
    if (PAYMENT_INTENT_EVENTS.has(event.type)) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.$transaction(
        tx =>
          applyStripePaymentTransition(tx, {
            paymentIntentId: paymentIntent.id,
            eventType: event.type,
            stripeStatus: paymentIntent.status,
            stripeAmountInMinorUnits: paymentIntent.amount,
            stripeCurrency: paymentIntent.currency,
            lastPaymentError:
              paymentIntent.last_payment_error?.message ?? undefined,
          }),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } else if (event.type === 'charge.refunded') {
      await handleChargeRefunded(event.data.object as Stripe.Charge);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook处理失败:', error);
    if (error instanceof StripePaymentTransitionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
  if (!paymentIntentId) throw new Error('退款事件缺少payment_intent');

  await prisma.$transaction(
    async tx => {
      const payment = await tx.payment.findFirst({
        where: { providerTransactionId: paymentIntentId },
      });
      if (!payment)
        throw new StripePaymentTransitionError(
          '支付记录不存在',
          'PAYMENT_NOT_FOUND',
        );

      const existingMetadata =
        typeof payment.metadata === 'object' &&
        payment.metadata !== null &&
        !Array.isArray(payment.metadata)
          ? payment.metadata
          : {};
      const fullyRefunded = charge.amount_refunded >= charge.amount;
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          ...(fullyRefunded ? { status: 'REFUNDED' } : {}),
          metadata: {
            ...existingMetadata,
            refundedAmount: charge.amount_refunded,
            refundStatus: charge.refunded ? 'succeeded' : 'pending',
            updatedAt: new Date().toISOString(),
          },
        },
      });

      if (fullyRefunded) {
        await tx.order.updateMany({
          where: { id: payment.orderId },
          data: { status: 'REFUNDED' },
        });
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
