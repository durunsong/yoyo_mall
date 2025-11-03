import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const updateCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称过长').optional(),
  slug: z.string().min(1, 'URL标识不能为空').max(100, 'URL标识过长').optional(),
  description: z.string().max(500, '描述过长').optional().nullable(),
  image: z.string().url('图片URL格式不正确').optional().nullable(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0, '排序值不能为负数').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true, isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'CATEGORY_NOT_FOUND', message: '分类不存在' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'CATEGORY_NOT_FOUND', message: '分类不存在' },
        { status: 404 },
      );
    }

    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'SLUG_EXISTS', message: 'URL标识已存在' },
          { status: 400 },
        );
      }
    }

    if (data.parentId) {
      if (data.parentId === id) {
        return NextResponse.json(
          { success: false, error: 'INVALID_PARENT', message: '父级分类不能是自身' },
          { status: 400 },
        );
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'PARENT_NOT_FOUND', message: '父级分类不存在' },
          { status: 400 },
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        parentId: data.parentId === undefined ? undefined : data.parentId || null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '分类更新成功',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('更新分类失败:', error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'CATEGORY_NOT_FOUND', message: '分类不存在' },
        { status: 404 },
      );
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'CATEGORY_HAS_PRODUCTS',
          message: '该分类下存在商品，无法删除。请先重新分配商品或将分类设为禁用。',
        },
        { status: 400 },
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'CATEGORY_HAS_CHILDREN',
          message: '该分类下还有子分类，无法删除。请先删除或移动子分类。',
        },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '分类删除成功',
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}


