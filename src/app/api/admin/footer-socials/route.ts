/**
 * Footer社交媒体链接管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const socials = await prisma.footerSocial.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, socials });
  } catch (error) {
    console.error('获取Footer社交媒体链接失败:', error);
    // 如果表不存在或没有数据，返回空数组而不是500错误
    return NextResponse.json({ success: true, socials: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const body = await request.json();
    const { name, icon, href, color, sortOrder, isActive } = body;

    if (!name || !icon || !href) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const social = await prisma.footerSocial.create({
      data: {
        name,
        icon,
        href,
        color,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, social }, { status: 201 });
  } catch (error) {
    console.error('创建Footer社交媒体链接失败:', error);
    return NextResponse.json({ error: '创建Footer社交媒体链接失败' }, { status: 500 });
  }
}

