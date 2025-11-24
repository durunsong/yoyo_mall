/**
 * 管理后台 - 单个用户管理API
 * 提供用户详情查看、更新、删除功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * 更新用户验证schema
 */
const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  role: z.enum(['ADMIN', 'CUSTOMER', 'SUPER_ADMIN']).optional(),
  avatar: z.string().url().optional().nullable(),
});

/**
 * GET - 获取用户详情
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id: userId } = await params;
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    // 检查是否有管理员权限（ADMIN 或 SUPER_ADMIN）
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 获取用户详情
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            locale: true,
            timezone: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        addresses: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            company: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
            cartItems: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    const formattedUser = {
      ...user,
      orders: user.orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        total: Number(order.totalAmount),
      })),
      addresses: user.addresses.map(address => ({
        ...address,
        fullName: [address.firstName, address.lastName].filter(Boolean).join(' ').trim(),
        streetAddress: address.addressLine1,
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户详情失败' },
      { status: 500 },
    );
  }
}

/**
 * PATCH - 更新用户信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id: userId } = await params;
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    // 检查是否有管理员权限（ADMIN 或 SUPER_ADMIN）
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 解析请求体
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.avatar !== undefined && { avatar: validatedData.avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    console.log('管理员更新用户信息:', {
      adminId: session.user.id,
      targetUserId: userId,
      changes: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser,
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);

    // Zod验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: '更新用户信息失败' },
      { status: 500 },
    );
  }
}

/**
 * DELETE - 删除用户
 * 注意：这是软删除，实际项目中可能需要更复杂的逻辑
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id: userId } = await params;
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    // 检查是否有管理员权限（ADMIN 或 SUPER_ADMIN）
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 防止删除自己
    if (currentUser.id === userId) {
      return NextResponse.json(
        { success: false, error: '不能删除自己的账户' },
        { status: 400 },
      );
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    // 如果用户有订单，不允许直接删除（可以改为禁用）
    if (user._count.orders > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '该用户有关联订单，无法删除。请考虑禁用用户账户。',
        },
        { status: 400 },
      );
    }

    // 删除用户（级联删除相关数据）
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log('管理员删除用户:', {
      adminId: session.user.id,
      deletedUserId: userId,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 },
    );
  }
}


