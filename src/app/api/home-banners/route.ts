import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/home-banners
 * 前台获取首页轮播图（公开接口）
 */
export async function GET(request: NextRequest) {
  try {
    const banners = await prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        imageUrl: true,
        linkUrl: true,
        altText: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('获取轮播图失败:', error);
    return NextResponse.json(
      { success: false, error: '获取轮播图失败' },
      { status: 500 }
    );
  }
}

