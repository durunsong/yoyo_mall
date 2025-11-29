import { NextRequest, NextResponse } from 'next/server';
import { AdminEmailStatus } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(AdminEmailStatus).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawQuery: Record<string, string | undefined> = {};
    if (searchParams.has('page')) rawQuery.page = searchParams.get('page') ?? undefined;
    if (searchParams.has('limit')) rawQuery.limit = searchParams.get('limit') ?? undefined;
    if (searchParams.has('search')) rawQuery.search = searchParams.get('search') ?? undefined;
    if (searchParams.has('status')) rawQuery.status = searchParams.get('status') ?? undefined;

    const query = querySchema.parse(rawQuery);

    const where: any = {};

    if (query.search) {
      where.subject = { contains: query.search, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [logs, total] = await Promise.all([
      prisma.adminEmailLog.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          status: true,
          sendType: true,
          recipientCount: true,
          successCount: true,
          failureCount: true,
          failureReason: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminEmailLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasMore: query.page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error('获取邮件发送记录失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '参数错误', details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: '服务异常，请稍后再试' },
      { status: 500 },
    );
  }
}

