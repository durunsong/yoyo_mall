import { normalizeMoney } from '@/lib/money';

describe('normalizeMoney', () => {
  it('converts decimal API values to finite numbers', () => {
    expect(normalizeMoney('12.345')).toBe(12.345);
    expect(normalizeMoney(8.5)).toBe(8.5);
  });

  it('falls back to zero for missing or invalid values', () => {
    expect(normalizeMoney(null)).toBe(0);
    expect(normalizeMoney('not-a-number')).toBe(0);
  });
});
