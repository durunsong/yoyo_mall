import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// 添加到购物车验证
const addToCartSchema = z.object({
  productId: z.string().min(1, '商品ID不能为空'),
  variantId: z.string().optional(),
  quantity: z.number().min(1, '数量必须大于0').max(100, '数量不能超过100'),
});

// 更新购物车项目验证
const updateCartItemSchema = z.object({
  quantity: z.number().min(0, '数量不能为负数').max(100, '数量不能超过100'),
});

// 获取购物车内容
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户购物车
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            images: {
              select: { url: true, alt: true },
              take: 1,
              orderBy: { sortOrder: 'asc' },
            },
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
        variant: {
          include: {
            attributes: true,
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 计算购物车统计信息
    let totalItems = 0;
    let subtotal = 0;

    const formattedItems = cartItems.map(item => {
      const price = Number(item.variant?.price || item.product.price);
      const lineTotal = price * item.quantity;
      
      totalItems += item.quantity;
      subtotal += lineTotal;

      // 计算可用库存
      const inventory = item.variant?.inventory || item.product.inventory;
      const availableQuantity = inventory 
        ? inventory.quantity - inventory.reservedQuantity 
        : 0;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        lineTotal,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0]?.url || null,
          status: item.product.status,
        },
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name,
          sku: item.variant.sku,
          attributes: item.variant.attributes,
        } : null,
        availableQuantity,
        inStock: availableQuantity > 0 || item.product.allowOutOfStock,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          totalItems,
          subtotal,
          itemCount: cartItems.length,
        },
      },
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 添加商品到购物车
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, variantId, quantity } = addToCartSchema.parse(body);

    // 验证商品是否存在且可购买
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: {
          select: { quantity: true, reservedQuantity: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_FOUND', message: '商品不存在' },
        { status: 404 }
      );
    }

    if (product.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'PRODUCT_NOT_AVAILABLE', message: '商品暂不可购买' },
        { status: 400 }
      );
    }

    // 如果指定了变体，验证变体
    let variant = null;
    if (variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId, productId },
        include: {
          inventory: {
            select: { quantity: true, reservedQuantity: true },
          },
        },
      });

      if (!variant || !variant.isActive) {
        return NextResponse.json(
          { success: false, error: 'VARIANT_NOT_FOUND', message: '商品变体不存在或不可用' },
          { status: 404 }
        );
      }
    }

    // 检查库存
    const inventory = variant?.inventory || product.inventory;
    const availableQuantity = inventory 
      ? inventory.quantity - inventory.reservedQuantity 
      : 0;

    if (product.trackInventory && !product.allowOutOfStock && availableQuantity < quantity) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INSUFFICIENT_STOCK', 
          message: `库存不足，仅剩 ${availableQuantity} 件`,
          availableQuantity 
        },
        { status: 400 }
      );
    }

    // 检查购物车中是否已存在相同商品
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId,
        variantId: variantId || null,
      },
    });

    let cartItem;
    
    if (existingCartItem) {
      // 更新数量
      const newQuantity = existingCartItem.quantity + quantity;
      
      // 再次检查库存
      if (product.trackInventory && !product.allowOutOfStock && availableQuantity < newQuantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'INSUFFICIENT_STOCK', 
            message: `库存不足，您已有 ${existingCartItem.quantity} 件在购物车中，仅剩 ${availableQuantity} 件`,
            availableQuantity,
            currentQuantity: existingCartItem.quantity
          },
          { status: 400 }
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // 创建新的购物车项目
      cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId,
          variantId,
          quantity,
        },
      });
    }

    console.log('购物车操作成功:', {
      userId: session.user.id,
      productId,
      variantId,
      quantity,
      action: existingCartItem ? 'updated' : 'created',
    });

    return NextResponse.json({
      success: true,
      message: '已添加到购物车',
      data: cartItem,
    });
  } catch (error) {
    console.error('添加到购物车失败:', error);

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

// 清空购物车
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    });

    console.log('购物车清空成功:', { userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: '购物车已清空',
    });
  } catch (error) {
    console.error('清空购物车失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
