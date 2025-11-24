/**
 * 管理后台 - 用户管理API
 * 提供用户列表查询、搜索、筛选功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * 查询参数验证schema
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'CUSTOMER', 'GUEST']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET - 获取用户列表
 * 支持分页、搜索、筛选、排序
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    // 检查是否有管理员权限（ADMIN 或 SUPER_ADMIN）
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const rawQuery: any = {};
    
    if (searchParams.has('page')) rawQuery.page = searchParams.get('page');
    if (searchParams.has('limit')) rawQuery.limit = searchParams.get('limit');
    if (searchParams.has('search')) rawQuery.search = searchParams.get('search');
    if (searchParams.has('role')) rawQuery.role = searchParams.get('role');
    if (searchParams.has('status')) rawQuery.status = searchParams.get('status');
    if (searchParams.has('sortBy')) rawQuery.sortBy = searchParams.get('sortBy');
    if (searchParams.has('sortOrder')) rawQuery.sortOrder = searchParams.get('sortOrder');

    const query = querySchema.parse(rawQuery);

    // 构建筛选条件
    const where: any = {};

    // 搜索条件（邮箱、姓名）
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 角色筛选
    if (query.role) {
      where.role = query.role;
    }

    // 状态筛选（通过更新时间判断活跃度）
    if (query.status === 'inactive') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.updatedAt = { lt: thirtyDaysAgo };
    }

    // 计算分页
    const skip = (query.page - 1) * query.limit;

    // 查询用户列表
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
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
            },
          },
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasMore: query.page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);

    // Zod验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求参数无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 },
    );
  }
}

/**
 * POST - 创建新用户（管理员功能）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    // 检查是否有管理员权限（ADMIN 或 SUPER_ADMIN）
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 解析请求体
    const body = await request.json();
    const { email, name, role = 'CUSTOMER', password } = body;
    const allowedRoles = ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'] as const;
    const normalizedRole = allowedRoles.includes(role)
      ? (role as (typeof allowedRoles)[number])
      : 'CUSTOMER';

    // 验证必填字段
    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱、姓名和密码不能为空' },
        { status: 400 },
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 },
      );
    }

    // 加密密码
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: normalizedRole,
        profile: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('管理员创建新用户:', {
      adminId: session.user.id,
      newUserId: newUser.id,
      email: newUser.email,
    });

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      data: newUser,
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
      { status: 500 },
    );
  }
}


