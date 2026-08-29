import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  notes: z.string().max(500).optional(),
});

async function ensureAdmin() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role ?? '')
  ) {
    return null;
  }
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const session = await ensureAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  select: { url: true, alt: true },
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                attributes: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentMethod: true,
            provider: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        shipments: {
          select: {
            id: true,
            trackingNumber: true,
            carrier: true,
            method: true,
            status: true,
            shippedAt: true,
            deliveredAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'ORDER_NOT_FOUND', message: '订单不存在' },
        { status: 404 },
      );
    }

    const formattedOrder = {
      ...order,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        productSnapshot:
          typeof item.productSnapshot === 'string'
            ? JSON.parse(item.productSnapshot)
            : item.productSnapshot,
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error('管理员获取订单详情失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const session = await ensureAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 },
      );
    }
    const body = await request.json();
    const data = updateSchema.parse(body);

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
      },
    });

    console.log('管理员更新订单状态:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      adminId: session.user.id,
      newStatus: data.status,
    });

    return NextResponse.json({
      success: true,
      message: '订单状态更新成功',
      data: order,
    });
  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求参数无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('管理员更新订单状态失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

