import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * 标记所有通知为已读
 * POST /api/admin/notifications/read-all
 * 
 * 注意: 当前实现为简化版本,实际应用中应该在数据库中存储通知状态
 */
export async function POST(_request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 },
      );
    }

    const updated = await prisma.userNotification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    
    return NextResponse.json({
      success: true,
      message: '已全部标记为已读',
      count: updated.count,
    });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}
