/**
 * 用户通知操作API
 * DELETE /api/user/notifications/[id] - 删除通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * 删除通知
 * DELETE /api/user/notifications/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id: notificationId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 },
      );
    }

    const deleted = await prisma.userNotification.updateMany({
      where: { id: notificationId, userId: session.user.id },
      data: {
        metadata: {
          dismissed: true,
          dismissedAt: new Date().toISOString(),
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: '通知不存在' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: '通知已删除',
      data: { id: notificationId },
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}
