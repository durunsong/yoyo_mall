/**
 * 心愿单项管理API
 * 删除心愿单中的商品
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE - 从心愿单移除商品
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 },
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    // 获取心愿单项
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: params.id },
    });

    if (!wishlistItem) {
      return NextResponse.json(
        { success: false, error: '心愿单项不存在' },
        { status: 404 },
      );
    }

    // 检查权限
    if (wishlistItem.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '无权限操作' },
        { status: 403 },
      );
    }

    // 删除心愿单项
    await prisma.wishlistItem.delete({
      where: { id: params.id },
    });

    console.log('从心愿单移除:', {
      userId: user.id,
      wishlistItemId: params.id,
    });

    return NextResponse.json({
      success: true,
      message: '已从心愿单移除',
    });
  } catch (error) {
    console.error('从心愿单移除失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 },
    );
  }
}


