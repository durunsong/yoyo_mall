/**
 * 商品批量操作 API
 * 支持批量更新状态、批量删除等
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';

// 批量操作验证schema
const bulkOperationSchema = z.object({
  action: z.enum(['update_status', 'delete', 'update_category', 'update_brand']),
  productIds: z.array(z.string()).min(1, '至少选择一个商品'),
  data: z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
  }).optional(),
});

/**
 * 批量操作商品
 */
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
    const { action, productIds, data } = bulkOperationSchema.parse(body);

    console.log('批量操作请求:', { action, productIds, data });

    let result;
    let message = '';

    switch (action) {
      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'MISSING_STATUS', message: '缺少状态参数' },
            { status: 400 },
          );
        }

        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds },
          },
          data: {
            status: data.status,
          },
        });

        message = `成功更新 ${result.count} 个商品状态为 ${data.status}`;
        break;

      case 'update_category':
        if (!data?.categoryId) {
          return NextResponse.json(
            { success: false, error: 'MISSING_CATEGORY', message: '缺少分类ID' },
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

        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds },
          },
          data: {
            categoryId: data.categoryId,
          },
        });

        message = `成功将 ${result.count} 个商品移至分类 ${category.name}`;
        break;

      case 'update_brand':
        if (!data?.brandId) {
          return NextResponse.json(
            { success: false, error: 'MISSING_BRAND', message: '缺少品牌ID' },
            { status: 400 },
          );
        }

        // 验证品牌是否存在
        const brand = await prisma.brand.findUnique({
          where: { id: data.brandId },
        });

        if (!brand) {
          return NextResponse.json(
            { success: false, error: 'BRAND_NOT_FOUND', message: '品牌不存在' },
            { status: 400 },
          );
        }

        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds },
          },
          data: {
            brandId: data.brandId,
          },
        });

        message = `成功将 ${result.count} 个商品更新为品牌 ${brand.name}`;
        break;

      case 'delete':
        // 检查是否有商品存在订单
        const productsWithOrders = await prisma.product.findMany({
          where: {
            id: { in: productIds },
          },
          include: {
            _count: {
              select: { orderItems: true },
            },
          },
        });

        const hasOrders = productsWithOrders.some(p => p._count.orderItems > 0);

        if (hasOrders) {
          const productsWithOrdersNames = productsWithOrders
            .filter(p => p._count.orderItems > 0)
            .map(p => p.name);

          return NextResponse.json(
            {
              success: false,
              error: 'PRODUCTS_HAVE_ORDERS',
              message: `以下商品存在订单记录，无法删除: ${productsWithOrdersNames.join(', ')}`,
            },
            { status: 400 },
          );
        }

        // 批量删除相关数据
        await prisma.$transaction([
          // 删除库存记录
          prisma.inventory.deleteMany({
            where: { productId: { in: productIds } },
          }),
          // 删除商品图片
          prisma.productImage.deleteMany({
            where: { productId: { in: productIds } },
          }),
          // 删除商品变体
          prisma.productVariant.deleteMany({
            where: { productId: { in: productIds } },
          }),
          // 删除商品评价
          prisma.review.deleteMany({
            where: { productId: { in: productIds } },
          }),
          // 删除心愿单项目
          prisma.wishlistItem.deleteMany({
            where: { productId: { in: productIds } },
          }),
          // 删除购物车项目
          prisma.cartItem.deleteMany({
            where: { productId: { in: productIds } },
          }),
          // 删除商品
          prisma.product.deleteMany({
            where: { id: { in: productIds } },
          }),
        ]);

        message = `成功删除 ${productIds.length} 个商品`;
        result = { count: productIds.length };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'INVALID_ACTION', message: '无效的操作类型' },
          { status: 400 },
        );
    }

    console.log('批量操作成功:', { action, affectedCount: result.count });

    return NextResponse.json({
      success: true,
      message,
      data: {
        action,
        affectedCount: result.count,
      },
    });
  } catch (error) {
    console.error('批量操作失败:', error);

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
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      },
      { status: 500 },
    );
  }
}

