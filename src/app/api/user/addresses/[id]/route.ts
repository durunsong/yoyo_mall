/**
 * 单个地址管理API
 * PATCH: 更新地址
 * DELETE: 删除地址
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 更新地址
export async function PATCH(
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

    const body = await request.json();
    const {
      type,
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
    } = body;

    // 更新地址
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        type: type || address.type,
        firstName: firstName || address.firstName,
        lastName: lastName || address.lastName,
        company: company !== undefined ? company || null : address.company,
        addressLine1: addressLine1 || address.addressLine1,
        addressLine2: addressLine2 !== undefined ? addressLine2 || null : address.addressLine2,
        city: city || address.city,
        state: state || address.state,
        postalCode: postalCode || address.postalCode,
        country: country || address.country,
        phone: phone !== undefined ? phone || null : address.phone,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAddress,
      message: '地址更新成功',
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { success: false, error: '更新地址失败' },
      { status: 500 },
    );
  }
}

// 删除地址
export async function DELETE(
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

    // 如果是默认地址,需要先设置其他地址为默认
    if (address.isDefault) {
      const otherAddresses = await prisma.address.findFirst({
        where: {
          userId: user.id,
          id: { not: addressId },
        },
      });

      if (otherAddresses) {
        await prisma.address.update({
          where: { id: otherAddresses.id },
          data: { isDefault: true },
        });
      }
    }

    // 删除地址
    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({
      success: true,
      message: '地址删除成功',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { success: false, error: '删除地址失败' },
      { status: 500 },
    );
  }
}


