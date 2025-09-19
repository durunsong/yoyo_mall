import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// 订单查询参数验证
const orderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 创建订单验证
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().min(1).max(100),
    unitPrice: z.number().min(0),
  })).min(1, '订单必须包含至少一个商品'),
  shippingAddressId: z.string().min(1, '必须提供配送地址'),
  billingAddressId: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'APPLE_PAY', 'GOOGLE_PAY']),
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional(),
});

// 生成订单号
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// 获取订单列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = orderQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // 构建查询条件
    const where: any = {
      userId: session.user.id,
      ...(query.status && { status: query.status }),
    };

    // 分页计算
    const skip = (query.page - 1) * query.limit;

    // 执行查询
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
          payments: {
            select: {
              id: true,
              paymentMethod: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    // 分页信息
    const pagination = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page < Math.ceil(total / query.limit),
      hasPrev: query.page > 1,
    };

    return NextResponse.json({
      success: true,
      data: orders,
      pagination,
      filters: {
        status: query.status,
      },
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'VALIDATION_ERROR', 
          message: '请求参数无效',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建订单
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // 验证配送地址
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: data.shippingAddressId,
        userId: session.user.id,
      },
    });

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'ADDRESS_NOT_FOUND', message: '配送地址不存在' },
        { status: 400 }
      );
    }

    // 验证账单地址（如果提供）
    let billingAddress = null;
    if (data.billingAddressId) {
      billingAddress = await prisma.address.findFirst({
        where: {
          id: data.billingAddressId,
          userId: session.user.id,
        },
      });

      if (!billingAddress) {
        return NextResponse.json(
          { success: false, error: 'BILLING_ADDRESS_NOT_FOUND', message: '账单地址不存在' },
          { status: 400 }
        );
      }
    }

    // 验证商品并计算价格
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          inventory: true,
          variants: {
            where: { id: item.variantId || undefined },
            include: { inventory: true },
          },
        },
      });

      if (!product || product.status !== 'PUBLISHED') {
        return NextResponse.json(
          { success: false, error: 'PRODUCT_NOT_AVAILABLE', message: `商品 ${item.productId} 不可用` },
          { status: 400 }
        );
      }

      const variant = item.variantId ? product.variants[0] : null;
      const actualPrice = variant?.price || product.price;

      // 验证价格（防止前端价格被篡改）
      if (Math.abs(actualPrice - item.unitPrice) > 0.01) {
        return NextResponse.json(
          { success: false, error: 'PRICE_MISMATCH', message: '商品价格已变更，请重新确认' },
          { status: 400 }
        );
      }

      // 检查库存
      const inventory = variant?.inventory || product.inventory;
      const availableQuantity = inventory 
        ? inventory.quantity - inventory.reservedQuantity 
        : 0;

      if (product.trackInventory && !product.allowOutOfStock && availableQuantity < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'INSUFFICIENT_STOCK', 
            message: `商品 ${product.name} 库存不足，仅剩 ${availableQuantity} 件`,
            productName: product.name,
            availableQuantity 
          },
          { status: 400 }
        );
      }

      const lineTotal = actualPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        ...item,
        unitPrice: actualPrice,
        totalPrice: lineTotal,
        productSnapshot: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: actualPrice,
          image: product.images?.[0]?.url,
          variant: variant ? {
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            attributes: variant.attributes,
          } : null,
        },
      });
    }

    // 计算税费和运费（这里使用简单的计算，实际项目中应该根据地址和商品类型计算）
    const taxRate = 0.08; // 8% 税率
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= 99 ? 0 : 9.99; // 满$99免运费
    let discountAmount = 0;

    // 处理优惠券（如果有）
    if (data.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: data.couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() },
          usageLimit: { gt: prisma.coupon.fields.usageCount },
        },
      });

      if (!coupon) {
        return NextResponse.json(
          { success: false, error: 'INVALID_COUPON', message: '优惠券无效或已过期' },
          { status: 400 }
        );
      }

      // 计算折扣
      switch (coupon.type) {
        case 'PERCENTAGE':
          discountAmount = Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity);
          break;
        case 'FIXED_AMOUNT':
          discountAmount = Math.min(coupon.value, subtotal);
          break;
        case 'FREE_SHIPPING':
          discountAmount = shippingAmount;
          break;
      }
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // 使用数据库事务创建订单
    const order = await prisma.$transaction(async (tx) => {
      // 创建订单
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.user.id,
          status: 'PENDING',
          currency: 'USD',
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId,
          notes: data.notes,
        },
      });

      // 创建订单项目
      await tx.orderItem.createMany({
        data: validatedItems.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productSnapshot: item.productSnapshot,
        })),
      });

      // 预留库存
      for (const item of validatedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product?.trackInventory) {
          if (item.variantId) {
            await tx.inventory.updateMany({
              where: { variantId: item.variantId },
              data: {
                reservedQuantity: { increment: item.quantity },
              },
            });
          } else {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: {
                reservedQuantity: { increment: item.quantity },
              },
            });
          }
        }
      }

      // 更新优惠券使用次数
      if (data.couponCode) {
        await tx.coupon.update({
          where: { code: data.couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      // 清空用户购物车（可选）
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      });

      return newOrder;
    });

    console.log('订单创建成功:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: session.user.id,
      totalAmount,
      itemCount: validatedItems.length,
    });

    return NextResponse.json({
      success: true,
      message: '订单创建成功',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('创建订单失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
