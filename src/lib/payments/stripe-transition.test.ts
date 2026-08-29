import {
  isPaymentIntentAmountMatching,
  resolveStripePaymentTransition,
} from './stripe-transition';

describe('resolveStripePaymentTransition', () => {
  it('keeps orders pending while Stripe is still processing', () => {
    expect(
      resolveStripePaymentTransition('payment_intent.processing', 'processing'),
    ).toEqual({
      paymentStatus: 'PROCESSING',
      orderStatus: 'PENDING',
      inventoryAction: 'NONE',
    });
  });

  it('keeps retryable payment states pending', () => {
    expect(
      resolveStripePaymentTransition(
        'payment_intent.requires_payment_method',
        'requires_payment_method',
      ),
    ).toEqual({
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      inventoryAction: 'NONE',
    });
  });

  it('commits payment and inventory exactly when payment succeeds', () => {
    expect(
      resolveStripePaymentTransition('payment_intent.succeeded', 'succeeded'),
    ).toEqual({
      paymentStatus: 'COMPLETED',
      orderStatus: 'CONFIRMED',
      inventoryAction: 'COMMIT',
    });
  });

  it('cancels the order and releases inventory for failed payments', () => {
    expect(
      resolveStripePaymentTransition(
        'payment_intent.payment_failed',
        'requires_payment_method',
      ),
    ).toEqual({
      paymentStatus: 'FAILED',
      orderStatus: 'CANCELLED',
      inventoryAction: 'RELEASE',
    });
  });

  it('requires both amount and currency to match the order payment', () => {
    expect(
      isPaymentIntentAmountMatching({
        stripeAmountInMinorUnits: 1299,
        storedAmount: 12.99,
        stripeCurrency: 'usd',
        storedCurrency: 'USD',
      }),
    ).toBe(true);
    expect(
      isPaymentIntentAmountMatching({
        stripeAmountInMinorUnits: 1300,
        storedAmount: 12.99,
        stripeCurrency: 'usd',
        storedCurrency: 'USD',
      }),
    ).toBe(false);
    expect(
      isPaymentIntentAmountMatching({
        stripeAmountInMinorUnits: 1299,
        storedAmount: 12.99,
        stripeCurrency: 'eur',
        storedCurrency: 'USD',
      }),
    ).toBe(false);
  });
});
