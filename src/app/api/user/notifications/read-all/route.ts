/**
 * 标记所有通知为已读
 * POST /api/user/notifications/read-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
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
      message: '已标记所有通知为已读',
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}

