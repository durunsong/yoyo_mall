import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// 更新购物车项目验证
const updateCartItemSchema = z.object({
  quantity: z.number().min(0, '数量不能为负数').max(100, '数量不能超过100'),
});

// 更新购物车项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = updateCartItemSchema.parse(body);

    // 查找购物车项目
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
        variant: {
          include: {
            inventory: {
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'CART_ITEM_NOT_FOUND', message: '购物车项目不存在' },
        { status: 404 }
      );
    }

    // 如果数量为0，删除项目
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      console.log('购物车项目删除成功:', {
        userId: session.user.id,
        itemId,
        productId: cartItem.productId,
      });

      return NextResponse.json({
        success: true,
        message: '已从购物车移除',
      });
    }

    // 检查库存
    const inventory = cartItem.variant?.inventory || cartItem.product.inventory;
    const availableQuantity = inventory 
      ? inventory.quantity - inventory.reservedQuantity 
      : 0;

    if (cartItem.product.trackInventory && 
        !cartItem.product.allowOutOfStock && 
        availableQuantity < quantity) {
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

    // 更新数量
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: {
            images: {
              select: { url: true, alt: true },
              take: 1,
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        variant: {
          include: {
            attributes: true,
          },
        },
      },
    });

    console.log('购物车项目更新成功:', {
      userId: session.user.id,
      itemId,
      productId: cartItem.productId,
      oldQuantity: cartItem.quantity,
      newQuantity: quantity,
    });

    // 格式化响应数据
    const price = Number(updatedCartItem.variant?.price || updatedCartItem.product.price);
    const lineTotal = price * quantity;

    const formattedItem = {
      id: updatedCartItem.id,
      productId: updatedCartItem.productId,
      variantId: updatedCartItem.variantId,
      quantity: updatedCartItem.quantity,
      price,
      lineTotal,
      product: {
        id: updatedCartItem.product.id,
        name: updatedCartItem.product.name,
        slug: updatedCartItem.product.slug,
        image: updatedCartItem.product.images[0]?.url || null,
      },
      variant: updatedCartItem.variant ? {
        id: updatedCartItem.variant.id,
        name: updatedCartItem.variant.name,
        sku: updatedCartItem.variant.sku,
        attributes: updatedCartItem.variant.attributes,
      } : null,
      updatedAt: updatedCartItem.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: '购物车已更新',
      data: formattedItem,
    });
  } catch (error) {
    console.error('更新购物车项目失败:', error);

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

// 删除购物车项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    // 查找并删除购物车项目
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'CART_ITEM_NOT_FOUND', message: '购物车项目不存在' },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    console.log('购物车项目删除成功:', {
      userId: session.user.id,
      itemId,
      productId: cartItem.productId,
    });

    return NextResponse.json({
      success: true,
      message: '已从购物车移除',
    });
  } catch (error) {
    console.error('删除购物车项目失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
