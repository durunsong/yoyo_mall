import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 商品查询参数验证
const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

// 商品创建验证
const createProductSchema = z.object({
  name: z.string().min(1, '商品名称不能为空').max(255, '商品名称过长'),
  description: z.string().optional(),
  shortDesc: z.string().max(500, '简短描述过长').optional(),
  sku: z.string().min(1, 'SKU不能为空'),
  price: z.number().min(0, '价格不能为负数'),
  comparePrice: z.number().min(0, '对比价格不能为负数').optional(),
  currency: z.string().default('USD'),
  weight: z.number().min(0, '重量不能为负数').optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().min(1, '分类ID不能为空'),
  brandId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isDigital: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  allowOutOfStock: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = productQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      status: searchParams.get('status'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
    });

    // 构建查询条件
    const where: any = {
      AND: [
        // 搜索条件
        query.search ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
            { tags: { has: query.search } },
          ],
        } : {},
        // 分类筛选
        query.category ? { categoryId: query.category } : {},
        // 状态筛选
        query.status ? { status: query.status } : {},
        // 价格范围筛选
        query.minPrice !== undefined || query.maxPrice !== undefined ? {
          price: {
            ...(query.minPrice !== undefined && { gte: query.minPrice }),
            ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
          },
        } : {},
      ],
    };

    // 分页计算
    const skip = (query.page - 1) * query.limit;

    // 执行查询
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            select: { id: true, url: true, alt: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
            take: 3,
          },
          inventory: {
            select: { quantity: true, reservedQuantity: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    // 处理商品数据
    const formattedProducts = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product._count.reviews,
      availableQuantity: product.inventory
        ? product.inventory.quantity - product.inventory.reservedQuantity
        : 0,
      inStock: product.inventory
        ? (product.inventory.quantity - product.inventory.reservedQuantity) > 0
        : false,
    }));

    // 分页信息
    const pagination = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page < Math.ceil(total / query.limit),
      hasPrev: query.page > 1,
    };

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination,
      filters: {
        search: query.search,
        category: query.category,
        status: query.status,
        priceRange: {
          min: query.minPrice,
          max: query.maxPrice,
        },
      },
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);

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

// 创建商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createProductSchema.parse(body);

    // 检查SKU是否已存在
    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'SKU_EXISTS', message: 'SKU已存在' },
        { status: 400 }
      );
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'CATEGORY_NOT_FOUND', message: '分类不存在' },
        { status: 400 }
      );
    }

    // 验证品牌是否存在（如果提供了brandId）
    if (data.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId },
      });

      if (!brand) {
        return NextResponse.json(
          { success: false, error: 'BRAND_NOT_FOUND', message: '品牌不存在' },
          { status: 400 }
        );
      }
    }

    // 创建商品
    const product = await prisma.product.create({
      data: {
        ...data,
        slug: data.name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim(),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // 如果启用库存跟踪，创建库存记录
    if (data.trackInventory) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: 0,
          reservedQuantity: 0,
          lowStockThreshold: 10,
        },
      });
    }

    console.log('商品创建成功:', {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    });

    return NextResponse.json({
      success: true,
      message: '商品创建成功',
      data: product,
    }, { status: 201 });
  } catch (error) {
    console.error('创建商品失败:', error);

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
