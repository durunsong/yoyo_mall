import type { OrderStatus, PaymentStatus } from '@prisma/client';

export type InventoryAction = 'NONE' | 'COMMIT' | 'RELEASE';

export interface StripePaymentTransition {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  inventoryAction: InventoryAction;
}

export function resolveStripePaymentTransition(
  eventType: string,
  stripeStatus: string,
): StripePaymentTransition {
  if (
    eventType === 'payment_intent.succeeded' ||
    stripeStatus === 'succeeded'
  ) {
    return {
      paymentStatus: 'COMPLETED',
      orderStatus: 'CONFIRMED',
      inventoryAction: 'COMMIT',
    };
  }

  if (eventType === 'payment_intent.payment_failed') {
    return {
      paymentStatus: 'FAILED',
      orderStatus: 'CANCELLED',
      inventoryAction: 'RELEASE',
    };
  }

  if (eventType === 'payment_intent.canceled' || stripeStatus === 'canceled') {
    return {
      paymentStatus: 'CANCELLED',
      orderStatus: 'CANCELLED',
      inventoryAction: 'RELEASE',
    };
  }

  if (stripeStatus === 'processing') {
    return {
      paymentStatus: 'PROCESSING',
      orderStatus: 'PENDING',
      inventoryAction: 'NONE',
    };
  }

  return {
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
    inventoryAction: 'NONE',
  };
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

export function toStripeMinorUnits(amount: number, currency: string): number {
  return Math.round(
    amount * (ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase()) ? 1 : 100),
  );
}

export function isPaymentIntentAmountMatching({
  stripeAmountInMinorUnits,
  storedAmount,
  stripeCurrency,
  storedCurrency,
}: {
  stripeAmountInMinorUnits: number;
  storedAmount: number;
  stripeCurrency: string;
  storedCurrency: string;
}): boolean {
  return (
    stripeAmountInMinorUnits ===
      toStripeMinorUnits(storedAmount, storedCurrency) &&
    stripeCurrency.toLowerCase() === storedCurrency.toLowerCase()
  );
}
