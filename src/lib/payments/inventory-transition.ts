interface InventoryTransitionInput {
  stripeStatus: string;
  paymentWasOpen: boolean;
  orderWasPending: boolean;
}

export function shouldApplyInventoryTransition({
  stripeStatus,
  paymentWasOpen,
  orderWasPending,
}: InventoryTransitionInput): boolean {
  if (!paymentWasOpen || !orderWasPending) return false;
  return stripeStatus === 'succeeded' || stripeStatus === 'canceled' || stripeStatus === 'failed';
}
