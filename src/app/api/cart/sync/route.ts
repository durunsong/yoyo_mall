/**
 * 购物车同步 API
 * 将本地购物车数据同步到服务器
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: '无效的购物车数据' },
        { status: 400 },
      );
    }

    // 获取用户现有的购物车
    const existingCart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    // 如果用户没有购物车,创建一个
    if (!existingCart) {
      await prisma.cart.create({
        data: {
          userId: session.user.id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
            })),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: '购物车数据已同步',
      });
    }

    // 合并本地购物车和服务器购物车
    for (const localItem of items) {
      const existingItem = existingCart.items.find(
        (item) =>
          item.productId === localItem.productId &&
          item.variantId === localItem.variantId,
      );

      if (existingItem) {
        // 如果商品已存在,更新数量
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + localItem.quantity,
            totalPrice: (existingItem.quantity + localItem.quantity) * localItem.price,
          },
        });
      } else {
        // 如果商品不存在,添加新商品
        await prisma.cartItem.create({
          data: {
            cartId: existingCart.id,
            productId: localItem.productId,
            variantId: localItem.variantId,
            quantity: localItem.quantity,
            unitPrice: localItem.price,
            totalPrice: localItem.price * localItem.quantity,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '购物车数据已同步并合并',
    });
  } catch (error) {
    console.error('购物车同步失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '购物车同步失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 },
    );
  }
}

