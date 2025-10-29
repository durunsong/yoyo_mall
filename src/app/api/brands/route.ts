/**
 * 品牌管理 API
 * GET /api/brands - 获取所有品牌
 * POST /api/brands - 创建品牌
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// 品牌创建验证
const createBrandSchema = z.object({
  name: z.string().min(1, '品牌名称不能为空').max(100, '品牌名称过长'),
  slug: z.string().min(1, 'URL标识不能为空').max(100, 'URL标识过长'),
  description: z.string().max(1000, '描述过长').optional(),
  logo: z.string().url('Logo URL格式不正确').optional(),
  website: z.string().url('网站URL格式不正确').optional(),
  isActive: z.boolean().default(true),
});

// 品牌更新验证
const updateBrandSchema = createBrandSchema.partial();

// 获取品牌列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    } else if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: brands,
      meta: {
        total: brands.length,
      },
    });
  } catch (error) {
    console.error('获取品牌列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '获取品牌列表失败',
      },
      { status: 500 },
    );
  }
}

// 创建品牌
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = createBrandSchema.parse(body);

    // 检查slug是否已存在
    const existingBrand = await prisma.brand.findUnique({
      where: { slug: data.slug },
    });

    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: 'SLUG_EXISTS', message: 'URL标识已存在' },
        { status: 400 },
      );
    }

    // 检查name是否已存在
    const existingName = await prisma.brand.findUnique({
      where: { name: data.name },
    });

    if (existingName) {
      return NextResponse.json(
        { success: false, error: 'NAME_EXISTS', message: '品牌名称已存在' },
        { status: 400 },
      );
    }

    // 创建品牌
    const brand = await prisma.brand.create({
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    console.log('品牌创建成功:', {
      brandId: brand.id,
      name: brand.name,
      slug: brand.slug,
    });

    return NextResponse.json({
      success: true,
      message: '品牌创建成功',
      data: brand,
    }, { status: 201 });
  } catch (error) {
    console.error('创建品牌失败:', error);

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
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

