/**
 * Newsletter 管理后台 API - 获取订阅者列表
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/authz';

export async function GET() {
  try {
    const session = await auth();

    // 验证管理员权限
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 获取所有订阅者
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: {
        subscribedAt: 'desc',
      },
    });

    // 统计信息
    const stats = {
      total: subscribers.length,
      active: subscribers.filter(s => s.status === 'ACTIVE').length,
      pending: subscribers.filter(s => s.status === 'PENDING').length,
      unsubscribed: subscribers.filter(s => s.status === 'UNSUBSCRIBED').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        stats,
      },
    });
  } catch (error) {
    console.error('获取订阅者列表失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}
