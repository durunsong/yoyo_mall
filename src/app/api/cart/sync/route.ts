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

    // 验证所有商品是否在数据库中存在
    const productIds = items.map((item: any) => item.id || item.productId);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
      },
    });

    const existingProductIds = new Set(existingProducts.map(p => p.id));
    
    // 过滤出存在的商品
    const validItems = items.filter((item: any) => {
      const productId = item.id || item.productId;
      const isValid = existingProductIds.has(productId);
      if (!isValid) {
        console.warn(`⚠️ 商品 ${productId} 不存在,跳过同步`);
      }
      return isValid;
    });

    if (validItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有有效的商品需要同步',
      });
    }

    // 获取用户现有的购物车商品
    const existingCartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // 如果用户购物车为空,直接创建所有有效商品
    if (existingCartItems.length === 0) {
      await prisma.cartItem.createMany({
        data: validItems.map((item: any) => ({
          userId: session.user.id,
          productId: item.id || item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        })),
      });

      return NextResponse.json({
        success: true,
        message: `购物车数据已同步 (${validItems.length}件商品)`,
      });
    }

    // 合并本地购物车和服务器购物车
    for (const localItem of validItems) {
      const productId = localItem.id || localItem.productId;
      const variantId = localItem.variantId || null;
      
      const existingItem = existingCartItems.find(
        (item) =>
          item.productId === productId &&
          item.variantId === variantId,
      );

      if (existingItem) {
        // 如果商品已存在,更新数量
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + localItem.quantity,
          },
        });
      } else {
        // 如果商品不存在,添加新商品
        await prisma.cartItem.create({
          data: {
            userId: session.user.id,
            productId: productId,
            variantId: variantId,
            quantity: localItem.quantity,
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



