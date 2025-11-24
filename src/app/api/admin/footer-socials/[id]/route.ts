/**
 * Footer社交媒体链接单项管理API
 * 支持获取、更新、删除单个社交媒体链接
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// 获取单个社交媒体链接
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const social = await prisma.footerSocial.findUnique({
      where: { id },
    });

    if (!social) {
      return NextResponse.json({ error: '社交媒体链接不存在' }, { status: 404 });
    }

    return NextResponse.json({ social });
  } catch (error) {
    console.error('获取Footer社交媒体链接失败:', error);
    return NextResponse.json({ error: '获取Footer社交媒体链接失败' }, { status: 500 });
  }
}

// 更新单个社交媒体链接
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const body = await request.json();
    const { name, icon, href, color, sortOrder, isActive } = body;

    // 检查社交媒体链接是否存在
    const existingSocial = await prisma.footerSocial.findUnique({
      where: { id },
    });

    if (!existingSocial) {
      return NextResponse.json({ error: '社交媒体链接不存在' }, { status: 404 });
    }

    // 更新社交媒体链接
    const social = await prisma.footerSocial.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingSocial.name,
        icon: icon !== undefined ? icon : existingSocial.icon,
        href: href !== undefined ? href : existingSocial.href,
        color: color !== undefined ? color : existingSocial.color,
        sortOrder: sortOrder !== undefined ? sortOrder : existingSocial.sortOrder,
        isActive: isActive !== undefined ? isActive : existingSocial.isActive,
      },
    });

    return NextResponse.json({ success: true, social });
  } catch (error) {
    console.error('更新Footer社交媒体链接失败:', error);
    return NextResponse.json({ error: '更新Footer社交媒体链接失败' }, { status: 500 });
  }
}

// 删除单个社交媒体链接
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    // 检查社交媒体链接是否存在
    const existingSocial = await prisma.footerSocial.findUnique({
      where: { id },
    });

    if (!existingSocial) {
      return NextResponse.json({ error: '社交媒体链接不存在' }, { status: 404 });
    }

    // 删除社交媒体链接
    await prisma.footerSocial.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '社交媒体链接已删除' });
  } catch (error) {
    console.error('删除Footer社交媒体链接失败:', error);
    return NextResponse.json({ error: '删除Footer社交媒体链接失败' }, { status: 500 });
  }
}

