/**
 * Newsletter 管理后台 API - 导出订阅者
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/authz';

export async function GET() {
  try {
    const session = await auth();

    // 验证管理员权限
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 获取所有激活的订阅者
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        email: true,
        subscribedAt: true,
        confirmedAt: true,
        source: true,
      },
      orderBy: {
        subscribedAt: 'desc',
      },
    });

    // 生成 CSV 内容
    const csvHeaders = '邮箱,订阅时间,确认时间,来源\n';
    const csvRows = subscribers.map(sub => 
      `${sub.email},${new Date(sub.subscribedAt).toLocaleString('zh-CN')},${sub.confirmedAt ? new Date(sub.confirmedAt).toLocaleString('zh-CN') : ''},${sub.source || ''}`,
    ).join('\n');
    
    const csv = '\uFEFF' + csvHeaders + csvRows; // 添加 BOM 以支持中文

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('导出订阅者失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}
