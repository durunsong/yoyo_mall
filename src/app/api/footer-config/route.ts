/**
 * Footer配置公共API
 * 供前端Footer组件读取配置数据（无需权限验证）
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/footer-config
 * 获取所有Footer配置（区块、链接、联系信息、社交媒体）
 */
export async function GET(request: NextRequest) {
  try {
    // 并行获取所有Footer配置数据
    const [sections, contacts, socials] = await Promise.all([
      // 获取所有激活的区块及其链接
      prisma.footerSection.findMany({
        where: { isActive: true },
        include: {
          links: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      // 获取所有激活的联系信息
      prisma.footerContact.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      // 获取所有激活的社交媒体链接
      prisma.footerSocial.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return NextResponse.json({
      sections,
      contacts,
      socials,
    });
  } catch (error) {
    console.error('获取Footer配置失败:', error);
    return NextResponse.json(
      { error: '获取Footer配置失败' },
      { status: 500 }
    );
  }
}

