/**
 * Footer链接管理API
 * 管理Footer区块中的链接
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/footer-links
 * 获取所有Footer链接或特定区块的链接
 */
export async function GET(request: NextRequest) {
  try {
    // 权限验证
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    // 构建查询条件
    const where = sectionId ? { sectionId } : {};

    // 获取链接
    const links = await prisma.footerLink.findMany({
      where,
      include: {
        section: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('获取Footer链接失败:', error);
    return NextResponse.json(
      { error: '获取Footer链接失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/footer-links
 * 创建新的Footer链接
 */
export async function POST(request: NextRequest) {
  try {
    // 权限验证
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      sectionId, 
      name, 
      nameEn, 
      nameZh, 
      href, 
      sortOrder, 
      isActive, 
      openInNew 
    } = body;

    // 验证必填字段
    if (!sectionId || !name || !href) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 检查区块是否存在
    const section = await prisma.footerSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Footer区块不存在' },
        { status: 404 }
      );
    }

    // 创建链接
    const link = await prisma.footerLink.create({
      data: {
        sectionId,
        name,
        nameEn,
        nameZh,
        href,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        openInNew: openInNew || false,
      },
      include: {
        section: true,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('创建Footer链接失败:', error);
    return NextResponse.json(
      { error: '创建Footer链接失败' },
      { status: 500 }
    );
  }
}

