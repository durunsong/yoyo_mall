/**
 * 品牌列表 API
 * GET /api/brands - 获取所有品牌
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '获取品牌列表失败',
      },
      { status: 500 }
    );
  }
}

