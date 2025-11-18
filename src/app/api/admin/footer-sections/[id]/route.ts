/**
 * Footer区块详情API
 * 管理单个Footer区块的更新和删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/footer-sections/[id]
 * 获取单个Footer区块详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const section = await prisma.footerSection.findUnique({
      where: { id: params.id },
      include: {
        links: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Footer区块不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('获取Footer区块详情失败:', error);
    return NextResponse.json(
      { error: '获取Footer区块详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/footer-sections/[id]
 * 更新Footer区块
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { title, titleEn, titleZh, sortOrder, isActive } = body;

    // 检查区块是否存在
    const existing = await prisma.footerSection.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Footer区块不存在' },
        { status: 404 }
      );
    }

    // 更新区块
    const section = await prisma.footerSection.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(titleEn !== undefined && { titleEn }),
        ...(titleZh !== undefined && { titleZh }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        links: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({ section });
  } catch (error) {
    console.error('更新Footer区块失败:', error);
    return NextResponse.json(
      { error: '更新Footer区块失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/footer-sections/[id]
 * 删除Footer区块
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 检查区块是否存在
    const existing = await prisma.footerSection.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Footer区块不存在' },
        { status: 404 }
      );
    }

    // 删除区块（级联删除所有关联的链接）
    await prisma.footerSection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Footer区块删除成功' });
  } catch (error) {
    console.error('删除Footer区块失败:', error);
    return NextResponse.json(
      { error: '删除Footer区块失败' },
      { status: 500 }
    );
  }
}

