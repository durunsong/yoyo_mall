import { getRefundMinorUnits } from './refund';

describe('getRefundMinorUnits', () => {
  it('defaults to the remaining amount and rejects values above it', () => {
    expect(getRefundMinorUnits(undefined, 1299, 0)).toBe(1299);
    expect(getRefundMinorUnits(5, 1299, 499)).toBe(500);
    expect(() => getRefundMinorUnits(14, 1299, 0)).toThrow(
      '退款金额超过可退金额',
    );
  });
});
