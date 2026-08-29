import { calculateCheckoutTotals } from '@/lib/pricing';

describe('calculateCheckoutTotals', () => {
  it('includes coupon discount and keeps the total non-negative', () => {
    expect(
      calculateCheckoutTotals({
        subtotal: 20,
        shipping: 9.99,
        tax: 1.6,
        discount: 50,
      }),
    ).toEqual({
      subtotal: 20,
      shipping: 9.99,
      tax: 1.6,
      discount: 31.59,
      total: 0,
    });
  });

  it('rounds each amount to cents', () => {
    expect(
      calculateCheckoutTotals({
        subtotal: 19.999,
        shipping: 9.999,
        tax: 1.234,
        discount: 0.111,
      }),
    ).toEqual({
      subtotal: 20,
      shipping: 10,
      tax: 1.23,
      discount: 0.11,
      total: 31.12,
    });
  });
});
