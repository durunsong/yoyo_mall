import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/home-config
 * 前台获取首页配置（公开接口）
 */
export async function GET(request: NextRequest) {
  try {
    // 获取当前激活的配置
    const activeConfig = await prisma.homeConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    // 如果没有配置，返回空的默认结构
    if (!activeConfig) {
      return NextResponse.json({
        success: true,
        data: {
          modules: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        modules: activeConfig.modules,
      },
    });
  } catch (error) {
    console.error('获取首页配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}

