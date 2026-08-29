export interface AccountStats {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  wishlistCount: number;
  addressCount: number;
}

export function buildAccountStats(
  orderCounts: Record<string, number>,
  wishlistCount: number,
  addressCount: number,
): AccountStats {
  const totalOrders = Object.values(orderCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return {
    totalOrders,
    pendingOrders: orderCounts.PENDING ?? 0,
    shippedOrders: orderCounts.SHIPPED ?? 0,
    completedOrders: orderCounts.DELIVERED ?? 0,
    wishlistCount,
    addressCount,
  };
}
