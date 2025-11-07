import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { HomePageConfig } from '@/types/home-config';

/**
 * GET /api/admin/home-config
 * 获取首页配置
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    
    // 支持 ADMIN 和 SUPER_ADMIN
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    if (!session?.user || !isAdmin) {
      console.log('权限验证失败 - Role:', userRole);
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    // 获取当前激活的配置
    const activeConfig = await prisma.homeConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!activeConfig) {
      // 如果没有配置，返回默认配置结构
      return NextResponse.json({
        success: true,
        data: {
          id: '',
          name: '默认首页配置',
          isActive: true,
          modules: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as HomePageConfig,
      });
    }

    // 解析并返回配置
    const config: HomePageConfig = {
      id: activeConfig.id,
      name: '首页配置',
      isActive: activeConfig.isActive,
      modules: activeConfig.modules as any,
      createdAt: activeConfig.createdAt,
      updatedAt: activeConfig.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('获取首页配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/home-config
 * 创建或更新首页配置
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { modules } = body;

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, error: '模块配置格式错误' },
        { status: 400 }
      );
    }

    // 先将所有配置设为非激活状态
    await prisma.homeConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // 创建新配置
    const newConfig = await prisma.homeConfig.create({
      data: {
        isActive: true,
        modules: modules as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newConfig.id,
        name: '首页配置',
        isActive: newConfig.isActive,
        modules: newConfig.modules,
        createdAt: newConfig.createdAt,
        updatedAt: newConfig.updatedAt,
      } as HomePageConfig,
    });
  } catch (error) {
    console.error('保存首页配置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存配置失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/home-config
 * 更新现有配置
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, modules } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少配置ID' },
        { status: 400 }
      );
    }

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, error: '模块配置格式错误' },
        { status: 400 }
      );
    }

    // 更新配置
    const updatedConfig = await prisma.homeConfig.update({
      where: { id },
      data: {
        modules: modules as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConfig.id,
        name: '首页配置',
        isActive: updatedConfig.isActive,
        modules: updatedConfig.modules,
        createdAt: updatedConfig.createdAt,
        updatedAt: updatedConfig.updatedAt,
      } as HomePageConfig,
    });
  } catch (error) {
    console.error('更新首页配置失败:', error);
    return NextResponse.json(
      { success: false, error: '更新配置失败' },
      { status: 500 }
    );
  }
}
