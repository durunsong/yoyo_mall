/**
 * 设置默认地址API
 * POST: 设置指定地址为默认地址
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const addressId = params.id;

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 验证地址所有权
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ success: false, error: '地址不存在或无权访问' }, { status: 404 });
    }

    // 使用事务更新默认地址
    await prisma.$transaction([
      // 将所有地址设为非默认
      prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      }),
      // 将选中地址设为默认
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '已设置为默认地址',
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { success: false, error: '设置默认地址失败' },
      { status: 500 },
    );
  }
}


