/**
 * Footer链接详情API
 * 管理单个Footer链接的更新和删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/footer-links/[id]
 * 获取单个Footer链接详情
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    // 权限验证
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const link = await prisma.footerLink.findUnique({
      where: { id },
      include: {
        section: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Footer链接不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('获取Footer链接详情失败:', error);
    return NextResponse.json(
      { error: '获取Footer链接详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/footer-links/[id]
 * 更新Footer链接
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
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
    const { name, nameEn, nameZh, href, sortOrder, isActive, openInNew } = body;

    // 检查链接是否存在
    const existing = await prisma.footerLink.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Footer链接不存在' },
        { status: 404 }
      );
    }

    // 更新链接
    const link = await prisma.footerLink.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameZh !== undefined && { nameZh }),
        ...(href !== undefined && { href }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(openInNew !== undefined && { openInNew }),
      },
      include: {
        section: true,
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error('更新Footer链接失败:', error);
    return NextResponse.json(
      { error: '更新Footer链接失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/footer-links/[id]
 * 删除Footer链接
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    // 权限验证
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    // 检查链接是否存在
    const existing = await prisma.footerLink.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Footer链接不存在' },
        { status: 404 }
      );
    }

    // 删除链接
    await prisma.footerLink.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Footer链接删除成功' });
  } catch (error) {
    console.error('删除Footer链接失败:', error);
    return NextResponse.json(
      { error: '删除Footer链接失败' },
      { status: 500 }
    );
  }
}

