import { buildAccountStats } from './stats';

describe('buildAccountStats', () => {
  it('maps order status groups and related counts into the account summary', () => {
    expect(
      buildAccountStats(
        {
          PENDING: 2,
          CONFIRMED: 1,
          SHIPPED: 3,
          DELIVERED: 4,
        },
        8,
        3,
      ),
    ).toEqual({
      totalOrders: 10,
      pendingOrders: 2,
      shippedOrders: 3,
      completedOrders: 4,
      wishlistCount: 8,
      addressCount: 3,
    });
  });

  it('uses zero for missing status groups', () => {
    expect(buildAccountStats({}, 0, 0)).toEqual({
      totalOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      completedOrders: 0,
      wishlistCount: 0,
      addressCount: 0,
    });
  });
});
