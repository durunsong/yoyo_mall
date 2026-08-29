/**
 * 标记所有通知为已读
 * POST /api/user/notifications/read-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
