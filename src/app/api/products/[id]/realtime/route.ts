import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        price: true,
        comparePrice: true,
        updatedAt: true,
        allowOutOfStock: true,
        inventory: {
          select: {
            quantity: true,
            reservedQuantity: true,
            lowStockThreshold: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 },
      );
    }

    const availableQuantity = product.inventory
      ? Math.max(0, product.inventory.quantity - product.inventory.reservedQuantity)
      : 0;
    const lowStockThreshold = product.inventory?.lowStockThreshold ?? 10;
    const inStock = product.allowOutOfStock || availableQuantity > 0;
    const isLowStock = !product.allowOutOfStock && availableQuantity > 0 && availableQuantity <= lowStockThreshold;

    return NextResponse.json(
      {
        success: true,
        data: {
          price: Number(product.price),
          comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
          availableQuantity,
          inStock,
          isLowStock,
          updatedAt: product.updatedAt.toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    console.error('获取实时商品数据失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}


