import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 更新个人信息的验证 schema
const updateProfileSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().max(500, '个人简介不能超过500个字符').optional(),
  location: z.string().max(100, '位置信息不能超过100个字符').optional(),
});

// 获取用户详细信息
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户详细信息，包括 profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 验证请求数据
    const validatedData = updateProfileSchema.parse(body);

    // 更新用户基本信息（不联表返回，避免访问未迁移的字段）
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
      },
    });

    // 更新或创建用户详细信息（暂时只更新现有字段）
    const profileData = {
      firstName: validatedData.firstName || '',
      lastName: validatedData.lastName || '',
      phone: validatedData.phone || '',
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
      // bio 和 location 字段需要数据库迁移后才能使用
      // bio: validatedData.bio || '',
      // location: validatedData.location || '',
    };

    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: profileData,
      create: {
        userId: session.user.id,
        ...profileData,
      },
      select: {
        userId: true,
      },
    });

    console.log('用户信息更新成功:', {
      userId: session.user.id,
      name: validatedData.name,
    });

    return NextResponse.json({
      success: true,
      message: '个人信息更新成功',
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);

    // Zod 验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
