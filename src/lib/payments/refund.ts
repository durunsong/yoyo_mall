import { toStripeMinorUnits } from './stripe-transition';

export function getRefundMinorUnits(
  requestedAmount: number | undefined,
  totalMinorUnits: number,
  refundedMinorUnits: number,
  currency = 'USD',
): number {
  const remaining = totalMinorUnits - refundedMinorUnits;
  const amount =
    requestedAmount === undefined
      ? remaining
      : toStripeMinorUnits(requestedAmount, currency);

  if (amount <= 0) throw new Error('退款金额必须大于0');
  if (amount > remaining) throw new Error('退款金额超过可退金额');
  return amount;
}
