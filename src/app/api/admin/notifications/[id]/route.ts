import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 },
      );
    }

    const deleted = await prisma.userNotification.updateMany({
      where: { id, userId: session.user.id },
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

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('删除管理员通知失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 },
    );
  }
}
