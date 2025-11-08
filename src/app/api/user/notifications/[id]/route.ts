/**
 * 用户通知操作API
 * DELETE /api/user/notifications/[id] - 删除通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * 删除通知
 * DELETE /api/user/notifications/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 },
      );
    }

    const notificationId = params.id;

    // TODO: 在实际应用中，应该在数据库中删除通知
    // 当前为简化实现，直接返回成功

    return NextResponse.json({
      success: true,
      message: '通知已删除',
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}

