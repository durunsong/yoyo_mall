import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * 获取管理员通知列表
 * GET /api/admin/notifications
 * 
 * 功能:
 * - 获取最近的系统通知
 * - 新订单提醒
 * - 库存预警
 * - 用户反馈
 */
export async function GET(_request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 },
      );
    }

    // 获取最近24小时的新订单
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
        status: 'PENDING',
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // 获取低库存商品(通过 inventory 表查询)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        inventory: {
          quantity: {
            lte: 10,
          },
        },
      },
      select: {
        id: true,
        name: true,
        inventory: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        inventory: {
          quantity: 'asc',
        },
      },
      take: 5,
    });

    // 获取最近的用户注册
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // 构建通知列表
    const notifications = [
      // 新订单通知
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: '新订单',
        message: `${order.user.name || order.user.email} 下单 ${order.orderNumber},金额 $${Number(order.totalAmount).toFixed(2)}`,
        url: `/admin/orders?id=${order.id}`,
        read: false,
        createdAt: order.createdAt.toISOString(),
      })),

      // 库存预警通知
      ...lowStockProducts.map((product) => ({
        id: `stock-${product.id}`,
        type: 'product' as const,
        title: '库存预警',
        message: `商品 "${product.name}" 库存不足,当前库存: ${product.inventory?.quantity || 0}`,
        url: `/admin/products?id=${product.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      })),

      // 新用户注册通知
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: '新用户注册',
        message: `${user.name || user.email} 注册了账号`,
        url: `/admin/users?id=${user.id}`,
        read: false,
        createdAt: user.createdAt.toISOString(),
      })),
    ];

    // 按时间排序
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 20), // 最多返回20条
      total: notifications.length,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    const errorMessage = error instanceof Error ? error.message : '获取通知失败';
    return NextResponse.json(
      { 
        success: false, 
        error: '获取通知失败',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

