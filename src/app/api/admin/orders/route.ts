import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z
    .enum([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ])
    .optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role ?? '')
    ) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        {
          orderNumber: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [orders, total, groupedStatus] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: {
                    select: { url: true },
                    take: 1,
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const counts = groupedStatus.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const serializedOrders = orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
    }));

    return NextResponse.json({
      success: true,
      data: serializedOrders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      counts: {
        total,
        PENDING: counts.PENDING ?? 0,
        CONFIRMED: counts.CONFIRMED ?? 0,
        PROCESSING: counts.PROCESSING ?? 0,
        SHIPPED: counts.SHIPPED ?? 0,
        DELIVERED: counts.DELIVERED ?? 0,
        CANCELLED: counts.CANCELLED ?? 0,
        REFUNDED: counts.REFUNDED ?? 0,
      },
    });
  } catch (error) {
    console.error('管理员获取订单列表失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

