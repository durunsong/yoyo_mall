/**
 * Footer区块管理API
 * 管理Footer的各个区块（Company, Customer Service等）
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/footer-sections
 * 获取所有Footer区块
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

    // 获取所有区块及其链接
    const sections = await prisma.footerSection.findMany({
      include: {
        links: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('获取Footer区块失败:', error);
    // 如果表不存在或没有数据，返回空数组而不是500错误
    return NextResponse.json({ sections: [] });
  }
}

/**
 * POST /api/admin/footer-sections
 * 创建新的Footer区块
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
    const { key, title, titleEn, titleZh, sortOrder, isActive } = body;

    // 验证必填字段
    if (!key || !title) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 检查key是否已存在
    const existing = await prisma.footerSection.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: '该区块key已存在' },
        { status: 400 }
      );
    }

    // 创建区块
    const section = await prisma.footerSection.create({
      data: {
        key,
        title,
        titleEn,
        titleZh,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        links: true,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('创建Footer区块失败:', error);
    return NextResponse.json(
      { error: '创建Footer区块失败' },
      { status: 500 }
    );
  }
}

