import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z
    .enum(['ADMIN', 'SUPER_ADMIN', 'CUSTOMER', 'GUEST'])
    .optional()
    .default('CUSTOMER'),
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
    if (searchParams.has('role')) rawQuery.role = searchParams.get('role') ?? undefined;

    const query = querySchema.parse(rawQuery);

    const where: any = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    } else {
      where.role = { in: ['CUSTOMER', 'GUEST'] };
    }

    const skip = (query.page - 1) * query.limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              locale: true,
              timezone: true,
              firstName: true,
              lastName: true,
            },
          },
          addresses: {
            select: {
              country: true,
              isDefault: true,
              updatedAt: true,
            },
            orderBy: [
              { isDefault: 'desc' },
              { updatedAt: 'desc' },
            ],
            take: 1,
          },
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const recipients = users.map(user => ({
      id: user.id,
      email: user.email,
      name:
        user.name ||
        [user.profile?.firstName, user.profile?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        '未命名用户',
      role: user.role,
      locale: user.profile?.locale,
      timezone: user.profile?.timezone,
      country: user.addresses[0]?.country ?? null,
      orderCount: user._count.orders,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return NextResponse.json({
      success: true,
      data: {
        recipients,
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
    console.error('获取邮件收件人失败:', error);
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

