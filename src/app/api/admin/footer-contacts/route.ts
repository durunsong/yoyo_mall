/**
 * Footer联系信息管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const contacts = await prisma.footerContact.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error('获取Footer联系信息失败:', error);
    // 如果表不存在或没有数据，返回空数组而不是500错误
    return NextResponse.json({ success: true, contacts: [] });
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
    const { type, label, labelEn, labelZh, value, icon, sortOrder, isActive } = body;

    if (!type || !label || !value) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const contact = await prisma.footerContact.create({
      data: {
        type,
        label,
        labelEn,
        labelZh,
        value,
        icon,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    console.error('创建Footer联系信息失败:', error);
    return NextResponse.json({ error: '创建Footer联系信息失败' }, { status: 500 });
  }
}

