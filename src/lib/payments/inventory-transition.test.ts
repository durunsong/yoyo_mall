import { shouldApplyInventoryTransition } from './inventory-transition';

describe('shouldApplyInventoryTransition', () => {
  it('applies a successful payment transition once', () => {
    expect(
      shouldApplyInventoryTransition({
        stripeStatus: 'succeeded',
        paymentWasOpen: true,
        orderWasPending: true,
      }),
    ).toBe(true);
  });

  it('releases stock for a failed or canceled open payment', () => {
    expect(
      shouldApplyInventoryTransition({
        stripeStatus: 'canceled',
        paymentWasOpen: true,
        orderWasPending: true,
      }),
    ).toBe(true);
  });

  it('does not apply inventory twice after the payment is already terminal', () => {
    expect(
      shouldApplyInventoryTransition({
        stripeStatus: 'succeeded',
        paymentWasOpen: false,
        orderWasPending: false,
      }),
    ).toBe(false);
  });
});
