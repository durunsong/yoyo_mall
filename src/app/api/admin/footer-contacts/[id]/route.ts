/**
 * Footer联系信息单项管理API
 * 支持获取、更新、删除单个联系信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// 获取单个联系信息
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

    const contact = await prisma.footerContact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json({ error: '联系信息不存在' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('获取Footer联系信息失败:', error);
    return NextResponse.json({ error: '获取Footer联系信息失败' }, { status: 500 });
  }
}

// 更新单个联系信息
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
    const { type, label, labelEn, labelZh, value, icon, sortOrder, isActive } = body;

    // 检查联系信息是否存在
    const existingContact = await prisma.footerContact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json({ error: '联系信息不存在' }, { status: 404 });
    }

    // 更新联系信息
    const contact = await prisma.footerContact.update({
      where: { id },
      data: {
        type: type !== undefined ? type : existingContact.type,
        label: label !== undefined ? label : existingContact.label,
        labelEn: labelEn !== undefined ? labelEn : existingContact.labelEn,
        labelZh: labelZh !== undefined ? labelZh : existingContact.labelZh,
        value: value !== undefined ? value : existingContact.value,
        icon: icon !== undefined ? icon : existingContact.icon,
        sortOrder: sortOrder !== undefined ? sortOrder : existingContact.sortOrder,
        isActive: isActive !== undefined ? isActive : existingContact.isActive,
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error('更新Footer联系信息失败:', error);
    return NextResponse.json({ error: '更新Footer联系信息失败' }, { status: 500 });
  }
}

// 删除单个联系信息
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

    // 检查联系信息是否存在
    const existingContact = await prisma.footerContact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json({ error: '联系信息不存在' }, { status: 404 });
    }

    // 删除联系信息
    await prisma.footerContact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '联系信息已删除' });
  } catch (error) {
    console.error('删除Footer联系信息失败:', error);
    return NextResponse.json({ error: '删除Footer联系信息失败' }, { status: 500 });
  }
}

