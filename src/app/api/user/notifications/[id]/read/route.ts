/**
 * 标记通知为已读
 * POST /api/user/notifications/[id]/read
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
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

    // TODO: 在实际应用中，应该在数据库中更新通知状态
    // 当前为简化实现，直接返回成功

    return NextResponse.json({
      success: true,
      message: '已标记为已读',
      data: { id: notificationId },
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}

