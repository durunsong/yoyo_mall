import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidateProductPages } from '@/lib/server/revalidate';

// 规范化 slug：允许中文与数字，去除首尾连接符
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 商品查询参数验证
const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

const productImageSchema = z.object({
  url: z.string().url('图片URL格式不正确'),
  alt: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

// 商品创建验证
const createProductSchema = z.object({
  name: z.string().min(1, '商品名称不能为空').max(255, '商品名称过长'),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDesc: z.string().max(500, '简短描述过长').optional(),
  sku: z.string().min(1, 'SKU不能为空'),
  price: z.number().min(0, '价格不能为负数'),
  comparePrice: z.number().min(0, '对比价格不能为负数').optional().nullable(),
  currency: z.string().default('USD'),
  weight: z.number().min(0, '重量不能为负数').optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().min(1, '分类ID不能为空'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isDigital: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  allowOutOfStock: z.boolean().default(false),
  inventoryQuantity: z.number().int().min(0, '库存不能为负数').optional().default(0),
  lowStockThreshold: z.number().int().min(0, '低库存阈值不能为负数').optional().default(10),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(productImageSchema).optional(),
});

// 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 构建查询对象，只包含存在的参数
    const rawQuery: any = {};
    
    if (searchParams.has('page')) rawQuery.page = searchParams.get('page');
    if (searchParams.has('limit')) rawQuery.limit = searchParams.get('limit');
    if (searchParams.has('search')) rawQuery.search = searchParams.get('search');
    if (searchParams.has('category')) rawQuery.category = searchParams.get('category');
    if (searchParams.has('sortBy')) rawQuery.sortBy = searchParams.get('sortBy');
    if (searchParams.has('sortOrder')) rawQuery.sortOrder = searchParams.get('sortOrder');
    if (searchParams.has('status')) rawQuery.status = searchParams.get('status');
    if (searchParams.has('minPrice')) rawQuery.minPrice = searchParams.get('minPrice');
    if (searchParams.has('maxPrice')) rawQuery.maxPrice = searchParams.get('maxPrice');
    
    const query = productQuerySchema.parse(rawQuery);

    // 如果指定了分类，获取该分类及其所有子分类的ID列表
    let categoryIds: string[] = [];
    if (query.category) {
      // 递归获取所有子分类ID
      const getAllChildCategoryIds = async (categoryId: string): Promise<string[]> => {
        const childCategories = await prisma.category.findMany({
          where: { parentId: categoryId },
          select: { id: true },
        });
        
        let ids = [categoryId];
        for (const child of childCategories) {
          const childIds = await getAllChildCategoryIds(child.id);
          ids = [...ids, ...childIds];
        }
        
        return ids;
      };
      
      categoryIds = await getAllChildCategoryIds(query.category);
    }

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
        // 分类筛选（包含该分类及其所有子分类）
        categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {},
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
        { status: 400 },
      );
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'CATEGORY_NOT_FOUND', message: '分类不存在' },
        { status: 400 },
      );
    }

    // 创建商品
    const {
      images = [],
      comparePrice,
      inventoryQuantity = 0,
      lowStockThreshold = 10,
      ...productData
    } = data;
    const normalizedComparePrice =
      typeof comparePrice === 'number' && comparePrice > 0 ? comparePrice : null;
    // 优先使用前端传来的 slug；否则根据名称生成。为空则兜底为时间戳。
    const rawSlug = data.slug && data.slug.trim() ? data.slug : productData.name;
    const baseSlug = slugify(rawSlug) || `p-${Date.now()}`;
    // 保证 slug 唯一：若已存在则追加时间戳
    let slug = baseSlug;
    const existWithSlug = await prisma.product.findUnique({ where: { slug } });
    if (existWithSlug) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        comparePrice: normalizedComparePrice,
        slug,
        images: images.length
          ? {
              create: images.map((image, index) => ({
                url: image.url,
                alt: image.alt ?? `${productData.name} 图片 ${index + 1}`,
                sortOrder: image.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          select: { id: true, url: true, alt: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // 如果启用库存跟踪，创建库存记录
    if (productData.trackInventory) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: inventoryQuantity,
          reservedQuantity: 0,
          lowStockThreshold,
        },
      });
    }

    console.log('商品创建成功:', {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    });

    await revalidateProductPages();

    return NextResponse.json(
      {
        success: true,
        message: '商品创建成功',
        data: product,
      },
      { status: 201 },
    );
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
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}
