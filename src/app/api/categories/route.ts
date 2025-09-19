import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 分类查询参数验证
const categoryQuerySchema = z.object({
  includeProducts: z.coerce.boolean().default(false),
  parentId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// 分类创建验证
const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称过长'),
  slug: z.string().min(1, 'URL标识不能为空').max(100, 'URL标识过长'),
  description: z.string().max(500, '描述过长').optional(),
  image: z.string().url('图片URL格式不正确').optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
});

// 分类更新验证
const updateCategorySchema = createCategorySchema.partial();

// 获取分类列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = categoryQuerySchema.parse({
      includeProducts: searchParams.get('includeProducts'),
      parentId: searchParams.get('parentId'),
      isActive: searchParams.get('isActive'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // 构建查询条件
    const where: any = {};
    
    if (query.parentId !== undefined) {
      where.parentId = query.parentId || null;
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // 构建包含关系
    const include: any = {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        select: { id: true, name: true, slug: true, isActive: true },
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { products: true },
      },
    };

    if (query.includeProducts) {
      include.products = {
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
        take: 10,
        orderBy: { createdAt: 'desc' },
      };
    }

    const categories = await prisma.category.findMany({
      where,
      include,
      orderBy: { [query.sortBy]: query.sortOrder },
    });

    // 如果查询所有根分类，构建树形结构
    if (query.parentId === null || query.parentId === '') {
      const buildCategoryTree = (cats: any[], parentId: string | null = null): any[] => {
        return cats
          .filter(cat => cat.parentId === parentId)
          .map(cat => ({
            ...cat,
            children: buildCategoryTree(cats, cat.id),
          }));
      };

      const allCategories = await prisma.category.findMany({
        where: query.isActive !== undefined ? { isActive: query.isActive } : {},
        include,
        orderBy: { [query.sortBy]: query.sortOrder },
      });

      const tree = buildCategoryTree(allCategories);
      
      return NextResponse.json({
        success: true,
        data: tree,
        meta: {
          total: allCategories.length,
          rootCount: tree.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
      meta: {
        total: categories.length,
        parentId: query.parentId,
      },
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'VALIDATION_ERROR', 
          message: '请求参数无效',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCategorySchema.parse(body);

    // 检查slug是否已存在
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'SLUG_EXISTS', message: 'URL标识已存在' },
        { status: 400 }
      );
    }

    // 如果指定了父级分类，验证其是否存在
    if (data.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'PARENT_NOT_FOUND', message: '父级分类不存在' },
          { status: 400 }
        );
      }
    }

    // 创建分类
    const category = await prisma.category.create({
      data,
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    console.log('分类创建成功:', {
      categoryId: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    });

    return NextResponse.json({
      success: true,
      message: '分类创建成功',
      data: category,
    }, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
