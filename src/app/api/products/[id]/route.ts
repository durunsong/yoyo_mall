import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 商品更新验证
const updateProductSchema = z.object({
  name: z.string().min(1, '商品名称不能为空').max(255, '商品名称过长').optional(),
  description: z.string().optional(),
  shortDesc: z.string().max(500, '简短描述过长').optional(),
  sku: z.string().min(1, 'SKU不能为空').optional(),
  price: z.number().min(0, '价格不能为负数').optional(),
  comparePrice: z.number().min(0, '对比价格不能为负数').optional(),
  currency: z.string().optional(),
  weight: z.number().min(0, '重量不能为负数').optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isDigital: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  allowOutOfStock: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// 获取单个商品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
        },
        variants: {
          include: {
            attributes: true,
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        inventory: {
          select: { quantity: true, reservedQuantity: true, lowStockThreshold: true },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 }
      );
    }

    // 计算平均评分
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      : 0;

    // 计算库存信息
    const availableQuantity = product.inventory
      ? product.inventory.quantity - product.inventory.reservedQuantity
      : 0;

    const formattedProduct = {
      ...product,
      averageRating,
      reviewCount: product._count.reviews,
      availableQuantity,
      inStock: availableQuantity > 0 || product.allowOutOfStock,
      isLowStock: product.inventory
        ? availableQuantity <= (product.inventory.lowStockThreshold || 10)
        : false,
    };

    return NextResponse.json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateProductSchema.parse(body);

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 }
      );
    }

    // 如果更新SKU，检查是否与其他商品冲突
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { success: false, error: 'SKU_EXISTS', message: 'SKU已存在' },
          { status: 400 }
        );
      }
    }

    // 验证分类是否存在
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'CATEGORY_NOT_FOUND', message: '分类不存在' },
          { status: 400 }
        );
      }
    }

    // 验证品牌是否存在
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

    // 更新商品
    const updateData: any = { ...data };
    if (data.name && data.name !== existingProduct.name) {
      updateData.slug = data.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
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
        },
      },
    });

    console.log('商品更新成功:', {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    });

    return NextResponse.json({
      success: true,
      message: '商品更新成功',
      data: product,
    });
  } catch (error) {
    console.error('更新商品失败:', error);

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

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 }
      );
    }

    // 检查是否有相关订单，如果有则不能删除
    if (existingProduct._count.orderItems > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PRODUCT_HAS_ORDERS', 
          message: '该商品存在相关订单，无法删除。建议将商品状态设为归档。' 
        },
        { status: 400 }
      );
    }

    // 删除相关的库存记录、图片、变体等
    await prisma.$transaction([
      // 删除库存记录
      prisma.inventory.deleteMany({
        where: { productId: id },
      }),
      // 删除商品图片
      prisma.productImage.deleteMany({
        where: { productId: id },
      }),
      // 删除商品变体（包含变体属性）
      prisma.productVariant.deleteMany({
        where: { productId: id },
      }),
      // 删除商品评价
      prisma.review.deleteMany({
        where: { productId: id },
      }),
      // 删除心愿单项目
      prisma.wishlistItem.deleteMany({
        where: { productId: id },
      }),
      // 最后删除商品
      prisma.product.delete({
        where: { id },
      }),
    ]);

    console.log('商品删除成功:', {
      productId: id,
      name: existingProduct.name,
      sku: existingProduct.sku,
    });

    return NextResponse.json({
      success: true,
      message: '商品删除成功',
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
