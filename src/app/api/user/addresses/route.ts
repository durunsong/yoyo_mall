/**
 * 用户地址管理API
 * GET: 获取用户所有地址
 * POST: 添加新地址
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取用户地址列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 获取地址列表
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { success: false, error: '获取地址列表失败' },
      { status: 500 }
    );
  }
}

// 添加新地址
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
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

    // 验证必填字段
    if (!firstName || !lastName || !addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 检查是否有默认地址
    const existingAddresses = await prisma.address.findMany({
      where: { userId: user.id },
    });

    // 如果这是第一个地址,自动设为默认
    const isDefault = existingAddresses.length === 0;

    // 创建地址
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        type: type || 'SHIPPING',
        firstName,
        lastName,
        company: company || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        country,
        phone: phone || null,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: address,
      message: '地址添加成功',
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { success: false, error: '添加地址失败' },
      { status: 500 }
    );
  }
}


