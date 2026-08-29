/**
 * 用户通知API
 * GET /api/user/notifications - 获取用户通知列表
 * POST /api/user/notifications/read-all - 标记所有通知为已读
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeNotificationReadStates } from '@/lib/notifications/read-state';

// 通知类型
type NotificationType = 'order' | 'system' | 'promotion' | 'wishlist';

// 通知接口
interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

type NotificationCategory =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_REFUNDED'
  | 'ACCOUNT_WELCOME'
  | 'ACCOUNT_SECURITY'
  | 'PROMOTION_START';

const notificationTypes: Record<NotificationType, 'ORDER' | 'SYSTEM' | 'PROMOTION'> = {
  order: 'ORDER',
  system: 'SYSTEM',
  promotion: 'PROMOTION',
  wishlist: 'PROMOTION',
};

async function persistNotifications(userId: string, notifications: Notification[]) {
  if (notifications.length === 0) return notifications;

  await Promise.all(
    notifications.map((notification) =>
      prisma.userNotification.upsert({
        where: { id: notification.id },
        create: {
          id: notification.id,
          userId,
          type: notificationTypes[notification.type],
          category: notification.category,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          read: notification.read,
        },
        update: {
          title: notification.title,
          message: notification.message,
          link: notification.link,
          category: notification.category,
        },
      }),
    ),
  );

  const savedStates = await prisma.userNotification.findMany({
    where: {
      userId,
      id: { in: notifications.map((notification) => notification.id) },
    },
    select: { id: true, read: true, metadata: true },
  });

  return mergeNotificationReadStates(
    notifications,
    new Map(
      savedStates.map((state) => [
        state.id,
        {
          read: state.read,
          dismissed: Boolean(
            state.metadata &&
              typeof state.metadata === 'object' &&
              !Array.isArray(state.metadata) &&
              (state.metadata as { dismissed?: unknown }).dismissed === true,
          ),
        },
      ]),
    ),
  );
}

/**
 * 获取用户通知列表
 * GET /api/user/notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'unread'

    // 基于订单、心愿单等实时生成通知
    const notifications: Notification[] = [];

    // 如果是管理员账号，生成系统通知
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      // 为管理员生成系统通知示例
      notifications.push({
        id: `admin-system-${userId}`,
        type: 'system',
        category: 'ACCOUNT_WELCOME',
        title: '欢迎使用管理系统',
        message: '您已成功登录管理系统，可以开始管理您的商城了',
        read: false,
        link: '/admin/dashboard',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      });

      // 检查是否有新订单
      const newOrdersCount = await prisma.order.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
          },
        },
      });

      if (newOrdersCount > 0) {
        notifications.push({
          id: `admin-orders-${userId}-${newOrdersCount}`,
          type: 'system',
          category: 'ORDER_PLACED',
          title: '新订单提醒',
          message: `您有 ${newOrdersCount} 个新订单待处理`,
          read: false,
          link: '/admin/orders',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1小时前
        });
      }

      // 添加促销通知示例
      notifications.push({
        id: `admin-promotion-${userId}`,
        type: 'promotion',
        category: 'PROMOTION_START',
        title: '限时优惠活动',
        message: '全场商品8折优惠，仅限今天！',
        read: false,
        link: '/deals',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
      });
    } else {
      // 普通用户：获取订单相关通知
      // 1. 获取最近的订单状态变化通知
      const recentOrders = await prisma.order.findMany({
        where: {
          userId,
        },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    // 根据订单状态生成通知
    recentOrders.forEach((order) => {
      let title = '';
      let message = '';
      let type: NotificationType = 'order';

      switch (order.status) {
        case 'PROCESSING':
          title = '订单处理中';
          message = `您的订单 #${order.orderNumber} 正在处理中`;
          break;
        case 'SHIPPED':
          title = '订单已发货';
          message = `您的订单 #${order.orderNumber} 已发货，预计3天内送达`;
          break;
        case 'DELIVERED':
          title = '订单已签收';
          message = `您的订单 #${order.orderNumber} 已签收，感谢购买！`;
          break;
        case 'CANCELLED':
          title = '订单已取消';
          message = `您的订单 #${order.orderNumber} 已取消`;
          break;
        default:
          return; // 跳过其他状态
      }

      notifications.push({
        id: `user-${userId}-order-${order.id}`,
        type,
        category: `ORDER_${order.status}` as NotificationCategory,
        title,
        message,
        read: false, // 可以根据需要从数据库读取已读状态
        link: `/account/orders`,
        createdAt: order.updatedAt,
      });
      });

      // 系统通知（账户安全提醒等）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

      if (user) {
        const daysSincePasswordChange = Math.floor(
          (Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSincePasswordChange > 90) {
          notifications.push({
            id: `system-password-${userId}`,
            type: 'system',
            category: 'ACCOUNT_SECURITY',
            title: '账户安全提醒',
            message: '您的密码已超过90天未更改，建议定期更改密码',
            read: false,
            link: '/account/settings',
            createdAt: new Date(),
          });
        }
      }
    }

    const persistedNotifications = await persistNotifications(userId, notifications);

    // 按时间排序
    persistedNotifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    // 应用筛选
    const filteredNotifications =
      filter === 'unread'
        ? persistedNotifications.filter((n) => !n.read)
        : persistedNotifications;

    return NextResponse.json({
      success: true,
      data: filteredNotifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(), // 序列化为ISO字符串
      })),
      total: persistedNotifications.length,
      unreadCount: persistedNotifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { success: false, error: '获取通知失败' },
      { status: 500 },
    );
  }
}

/**
 * 标记所有通知为已读
 * POST /api/user/notifications/read-all
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 },
      );
    }

    const updated = await prisma.userNotification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: '已标记所有通知为已读',
      count: updated.count,
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}
