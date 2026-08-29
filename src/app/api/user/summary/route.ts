import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildAccountStats } from '@/lib/account/stats';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const [statusGroups, wishlistCount, addressCount, recentOrders] =
      await Promise.all([
        prisma.order.groupBy({
          by: ['status'],
          where: { userId },
          _count: { _all: true },
        }),
        prisma.wishlistItem.count({ where: { userId } }),
        prisma.address.count({ where: { userId } }),
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
        }),
      ]);

    const orderCounts = Object.fromEntries(
      statusGroups.map((group) => [group.status, group._count._all]),
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: buildAccountStats(orderCounts, wishlistCount, addressCount),
        recentOrders: recentOrders.map((order) => ({
          ...order,
          totalAmount: order.totalAmount.toString(),
          createdAt: order.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('获取账户摘要失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '暂时无法加载账户摘要' },
      { status: 500 },
    );
  }
}
