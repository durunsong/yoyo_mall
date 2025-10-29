/**
 * 品牌详情管理 API
 * GET /api/brands/[id] - 获取品牌详情
 * PUT /api/brands/[id] - 更新品牌
 * DELETE /api/brands/[id] - 删除品牌
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// 品牌更新验证
const updateBrandSchema = z.object({
  name: z.string().min(1, '品牌名称不能为空').max(100, '品牌名称过长').optional(),
  slug: z.string().min(1, 'URL标识不能为空').max(100, 'URL标识过长').optional(),
  description: z.string().max(1000, '描述过长').optional(),
  logo: z.string().url('Logo URL格式不正确').optional(),
  website: z.string().url('网站URL格式不正确').optional(),
  isActive: z.boolean().optional(),
});

// 获取品牌详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            status: true,
            images: {
              select: { url: true, alt: true },
              take: 1,
              orderBy: { sortOrder: 'asc' },
            },
          },
          where: { status: 'PUBLISHED' },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'BRAND_NOT_FOUND', message: '品牌不存在' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error('获取品牌详情失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

// 更新品牌
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateBrandSchema.parse(body);

    // 检查品牌是否存在
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: 'BRAND_NOT_FOUND', message: '品牌不存在' },
        { status: 404 },
      );
    }

    // 如果更新slug，检查是否与其他品牌冲突
    if (data.slug && data.slug !== existingBrand.slug) {
      const slugExists = await prisma.brand.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'SLUG_EXISTS', message: 'URL标识已存在' },
          { status: 400 },
        );
      }
    }

    // 如果更新name，检查是否与其他品牌冲突
    if (data.name && data.name !== existingBrand.name) {
      const nameExists = await prisma.brand.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'NAME_EXISTS', message: '品牌名称已存在' },
          { status: 400 },
        );
      }
    }

    // 更新品牌
    const brand = await prisma.brand.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    console.log('品牌更新成功:', {
      brandId: brand.id,
      name: brand.name,
      slug: brand.slug,
    });

    return NextResponse.json({
      success: true,
      message: '品牌更新成功',
      data: brand,
    });
  } catch (error) {
    console.error('更新品牌失败:', error);

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

// 删除品牌
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    const { id } = await params;

    // 检查品牌是否存在
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: 'BRAND_NOT_FOUND', message: '品牌不存在' },
        { status: 404 },
      );
    }

    // 检查是否有关联商品
    if (existingBrand._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'BRAND_HAS_PRODUCTS',
          message: `该品牌下有 ${existingBrand._count.products} 个商品，无法删除。请先移除或重新分配这些商品。`,
        },
        { status: 400 },
      );
    }

    // 删除品牌
    await prisma.brand.delete({
      where: { id },
    });

    console.log('品牌删除成功:', {
      brandId: id,
      name: existingBrand.name,
    });

    return NextResponse.json({
      success: true,
      message: '品牌删除成功',
    });
  } catch (error) {
    console.error('删除品牌失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

