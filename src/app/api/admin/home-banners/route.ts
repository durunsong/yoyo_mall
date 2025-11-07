import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 权限检查辅助函数
const checkAdminPermission = async () => {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  return { session, isAdmin };
};

/**
 * GET /api/admin/home-banners
 * 获取所有轮播图
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const { session, isAdmin } = await checkAdminPermission();
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const banners = await prisma.homeBanner.findMany({
      orderBy: { sortOrder: 'asc' },
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

/**
 * POST /api/admin/home-banners
 * 创建轮播图
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const { session, isAdmin } = await checkAdminPermission();
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { imageUrl, linkUrl, altText, sortOrder, isActive } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '图片URL不能为空' },
        { status: 400 }
      );
    }

    const banner = await prisma.homeBanner.create({
      data: {
        imageUrl,
        linkUrl: linkUrl || '',
        altText: altText || '',
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('创建轮播图失败:', error);
    return NextResponse.json(
      { success: false, error: '创建轮播图失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/home-banners
 * 批量更新轮播图顺序
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const { session, isAdmin } = await checkAdminPermission();
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { banners } = body;

    if (!Array.isArray(banners)) {
      return NextResponse.json(
        { success: false, error: '数据格式错误' },
        { status: 400 }
      );
    }

    // 批量更新
    await Promise.all(
      banners.map((banner) =>
        prisma.homeBanner.update({
          where: { id: banner.id },
          data: {
            sortOrder: banner.sortOrder,
            isActive: banner.isActive,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新轮播图失败:', error);
    return NextResponse.json(
      { success: false, error: '更新轮播图失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/home-banners
 * 删除轮播图
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const { session, isAdmin } = await checkAdminPermission();
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少ID参数' },
        { status: 400 }
      );
    }

    await prisma.homeBanner.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除轮播图失败:', error);
    return NextResponse.json(
      { success: false, error: '删除轮播图失败' },
      { status: 500 }
    );
  }
}

