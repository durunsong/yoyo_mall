import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidateProductPages } from '@/lib/server/revalidate';

const productImageSchema = z.object({
  url: z.string().url('图片URL格式不正确'),
  alt: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

// 商品更新验证
const updateProductSchema = z.object({
  name: z.string().min(1, '商品名称不能为空').max(255, '商品名称过长').optional(),
  description: z.string().optional(),
  shortDesc: z.string().max(500, '简短描述过长').optional(),
  sku: z.string().min(1, 'SKU不能为空').optional(),
  price: z.number().min(0, '价格不能为负数').optional(),
  comparePrice: z.number().min(0, '对比价格不能为负数').optional().nullable(),
  currency: z.string().optional(),
  weight: z.number().min(0, '重量不能为负数').optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isDigital: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  allowOutOfStock: z.boolean().optional(),
  inventoryQuantity: z.number().int().min(0, '库存不能为负数').optional(),
  lowStockThreshold: z.number().int().min(0, '低库存阈值不能为负数').optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(productImageSchema).optional(),
});

// 获取单个商品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
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
        { status: 404 },
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
      { status: 500 },
    );
  }
}

// 更新商品 - 支持PUT和PATCH方法
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateProduct(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateProduct(request, params);
}

// 商品更新的核心逻辑
async function updateProduct(
  request: NextRequest,
  params: Promise<{ id: string }>,
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // 打印请求体，用于调试
    console.log('更新商品请求体:', JSON.stringify(body, null, 2));
    
    // 验证数据
    const validationResult = updateProductSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('验证失败:', validationResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'VALIDATION_ERROR', 
          message: '数据验证失败',
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }
    
    const data = validationResult.data;

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 },
      );
    }

    const existingInventory = await prisma.inventory.findUnique({
      where: { productId: id },
    });

    // 如果更新SKU，检查是否与其他商品冲突
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { success: false, error: 'SKU_EXISTS', message: 'SKU已存在' },
          { status: 400 },
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
          { status: 400 },
        );
      }
    }

    const { images, comparePrice, inventoryQuantity, lowStockThreshold, trackInventory, ...rest } = data;

    const updateData: any = { ...rest };

    if (comparePrice !== undefined) {
      updateData.comparePrice =
        typeof comparePrice === 'number' && comparePrice > 0 ? comparePrice : null;
    }

    if (rest.name && rest.name !== existingProduct.name) {
      updateData.slug = rest.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: updateData,
      });

      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });

        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((image, index) => ({
              productId: id,
              url: image.url,
              alt: image.alt ?? `${rest.name ?? existingProduct.name} 图片 ${index + 1}`,
              sortOrder: image.sortOrder ?? index,
            })),
          });
        }
      }

      if (
        inventoryQuantity !== undefined ||
        lowStockThreshold !== undefined ||
        trackInventory !== undefined
      ) {
        const shouldTrack = trackInventory ?? existingProduct.trackInventory;

        if (shouldTrack) {
          const quantity = inventoryQuantity ?? existingInventory?.quantity ?? 0;
          const lowStock = lowStockThreshold ?? existingInventory?.lowStockThreshold ?? 10;

          await tx.inventory.upsert({
            where: { productId: id },
            update: {
              ...(inventoryQuantity !== undefined && { quantity: inventoryQuantity }),
              ...(lowStockThreshold !== undefined && { lowStockThreshold: lowStockThreshold }),
            },
            create: {
              productId: id,
              quantity,
              reservedQuantity: existingInventory?.reservedQuantity ?? 0,
              lowStockThreshold: lowStock,
            },
          });
        } else if (existingInventory) {
          await tx.inventory.delete({
            where: { productId: id },
          });
        }
      }
    });

    const product = await prisma.product.findUnique({
      where: { id },
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

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 },
      );
    }

    console.log('商品更新成功:', {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    });

    await revalidateProductPages();

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
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 404 },
      );
    }

    // 检查是否有相关订单，如果有则不能删除
    if (existingProduct._count.orderItems > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PRODUCT_HAS_ORDERS', 
          message: '该商品存在相关订单，无法删除。建议将商品状态设为归档。', 
        },
        { status: 400 },
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

    await revalidateProductPages();

    return NextResponse.json({
      success: true,
      message: '商品删除成功',
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}
