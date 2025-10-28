/**
 * 心愿单API
 * 获取用户心愿单列表和添加商品到心愿单
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - 获取心愿单列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 获取心愿单
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: {
                sortOrder: 'asc',
              },
            },
            inventory: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: wishlistItems,
    });
  } catch (error) {
    console.error('获取心愿单失败:', error);
    return NextResponse.json(
      { success: false, error: '获取心愿单失败' },
      { status: 500 }
    );
  }
}

/**
 * POST - 添加商品到心愿单
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '商品ID不能为空' },
        { status: 400 }
      );
    }

    // 验证商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      );
    }

    // 检查是否已经在心愿单中
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: '商品已在心愿单中' },
        { status: 400 }
      );
    }

    // 添加到心愿单
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: {
          include: {
            images: {
              take: 1,
            },
          },
        },
      },
    });

    console.log('添加到心愿单:', {
      userId: user.id,
      productId,
    });

    return NextResponse.json({
      success: true,
      message: '已添加到心愿单',
      data: wishlistItem,
    });
  } catch (error) {
    console.error('添加到心愿单失败:', error);
    return NextResponse.json(
      { success: false, error: '添加到心愿单失败' },
      { status: 500 }
    );
  }
}

