import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CouponError, validateCouponAndCalculateDiscount } from '@/lib/coupon';
import {
  TAX_RATE,
  calculateShippingAmount,
  calculateTaxAmount,
  calculateDutyAmount,
  calculateInsuranceAmount,
  roundCurrency,
} from '@/lib/pricing';

// 订单查询参数验证
const orderQuerySchema = z.object({
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
    .optional()
    .nullable(),
  sortBy: z
    .enum(['createdAt', 'totalAmount', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// 创建订单验证
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().min(1).max(100),
        unitPrice: z.number().min(0),
      }),
    )
    .min(1, '订单必须包含至少一个商品'),
  shippingAddressId: z.string().min(1, '必须提供配送地址'),
  billingAddressId: z.string().optional(),
  paymentMethod: z.enum([
    'CREDIT_CARD',
    'PAYPAL',
    'BANK_TRANSFER',
    'APPLE_PAY',
    'GOOGLE_PAY',
  ]),
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
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = orderQuerySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    });

    // 构建查询条件
    const where: any = {
      userId: session.user.id,
      ...(query.status && { status: query.status }),
    };

    // 分页计算
    const skip = (query.page - 1) * query.limit;

    // 执行查询
    const [orders, total, statusGroups] = await Promise.all([
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
      prisma.order.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: {
          status: true,
        },
      }),
    ]);

    // 统计不同状态的订单数量，方便前端展示标签计数
    const statusCounts = statusGroups.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {},
    );

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
      counts: {
        all: total,
        ...statusCounts,
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
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
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
        { status: 401 },
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
        {
          success: false,
          error: 'ADDRESS_NOT_FOUND',
          message: '配送地址不存在',
        },
        { status: 400 },
      );
    }

    const normalizedCountryCode =
      shippingAddress.country?.toUpperCase() ?? 'CN';

    let market = await prisma.marketConfig.findUnique({
      where: { countryCode: normalizedCountryCode },
    });

    if (!market) {
      market = await prisma.marketConfig.findUnique({
        where: { countryCode: 'CN' },
      });
    }

    const shippingZone = market
      ? await prisma.shippingZone.findFirst({
          where: { marketId: market.id, enabled: true },
          orderBy: { baseFee: 'asc' },
        })
      : await prisma.shippingZone.findFirst({
          where: { code: 'CN_STANDARD' },
        });

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
          {
            success: false,
            error: 'BILLING_ADDRESS_NOT_FOUND',
            message: '账单地址不存在',
          },
          { status: 400 },
        );
      }
    }

    // 验证商品并计算价格
    let subtotal = 0;
    let totalWeight = 0;
    const validatedItems: any[] = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          inventory: true,
          images: {
            select: { url: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          variants: {
            where: {
              id: item.variantId || undefined,
              isActive: item.variantId ? true : undefined,
            },
            include: {
              inventory: true,
              attributes: true,
            },
          },
        },
      });

      if (!product || product.status !== 'PUBLISHED') {
        return NextResponse.json(
          {
            success: false,
            error: 'PRODUCT_NOT_AVAILABLE',
            message: `商品 ${item.productId} 不可用`,
          },
          { status: 400 },
        );
      }

      if (item.variantId && product.variants.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'VARIANT_NOT_FOUND',
            message: '商品规格不存在或已下架',
          },
          { status: 400 },
        );
      }

      const variant = item.variantId ? product.variants[0] : null;
      const actualPrice = Number(variant?.price ?? product.price);

      // 验证价格（防止前端价格被篡改）
      if (Math.abs(actualPrice - item.unitPrice) > 0.01) {
        return NextResponse.json(
          {
            success: false,
            error: 'PRICE_MISMATCH',
            message: '商品价格已变更，请重新确认',
          },
          { status: 400 },
        );
      }

      // 检查库存
      const inventory = variant?.inventory || product.inventory;
      const availableQuantity = inventory
        ? inventory.quantity - inventory.reservedQuantity
        : 0;

      if (
        product.trackInventory &&
        !product.allowOutOfStock &&
        availableQuantity < item.quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_STOCK',
            message: `商品 ${product.name} 库存不足，仅剩 ${availableQuantity} 件`,
            productName: product.name,
            availableQuantity,
          },
          { status: 400 },
        );
      }

      const lineTotal = actualPrice * item.quantity;
      subtotal += lineTotal;
      const productWeight = product.weight ? Number(product.weight) : 0.5;
      totalWeight += productWeight * item.quantity;

      validatedItems.push({
        ...item,
        trackInventory: product.trackInventory,
        allowOutOfStock: product.allowOutOfStock,
        unitPrice: actualPrice,
        totalPrice: lineTotal,
        productSnapshot: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: actualPrice,
          image: product.images?.[0]?.url,
          weight: product.weight ? Number(product.weight) : null,
          originCountry: product.originCountry,
          hsCode: product.hsCode,
          materials: product.materials,
          variant: variant
            ? {
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                attributes: variant.attributes,
              }
            : null,
        },
      });
    }

    subtotal = roundCurrency(subtotal);

    if (market?.minOrderAmount) {
      const minOrderAmount = Number(market.minOrderAmount);
      if (subtotal < minOrderAmount) {
        return NextResponse.json(
          {
            success: false,
            error: 'ORDER_BELOW_MINIMUM',
            message: `当前市场最低下单金额为 ${minOrderAmount}`,
            minOrderAmount,
          },
          { status: 400 },
        );
      }
    }

    const shippingZonePricing = shippingZone
      ? {
          baseFee: shippingZone.baseFee
            ? Number(shippingZone.baseFee)
            : undefined,
          perKgFee: shippingZone.perKgFee
            ? Number(shippingZone.perKgFee)
            : undefined,
          freeShippingThreshold: shippingZone.freeShippingThreshold
            ? Number(shippingZone.freeShippingThreshold)
            : undefined,
          fuelSurcharge: shippingZone.fuelSurcharge
            ? Number(shippingZone.fuelSurcharge)
            : undefined,
          maxWeight: shippingZone.maxWeight
            ? Number(shippingZone.maxWeight)
            : undefined,
        }
      : undefined;

    const taxRate = market?.taxRate ? Number(market.taxRate) : TAX_RATE;
    const dutyRate = market?.dutyRate ? Number(market.dutyRate) : undefined;
    const declaredValue = subtotal;

    const taxAmount = calculateTaxAmount(subtotal, taxRate);
    const shippingAmount = calculateShippingAmount(subtotal, {
      zone: shippingZonePricing,
      totalWeightKg: totalWeight,
    });
    const dutyAmount = calculateDutyAmount(declaredValue, {
      rate: dutyRate,
      minDeclaredValue: shippingZonePricing?.freeShippingThreshold,
    });
    const insuranceAmount = calculateInsuranceAmount(declaredValue);
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;
    if (data.couponCode) {
      try {
        const { discountAmount: couponDiscount, coupon } =
          await validateCouponAndCalculateDiscount({
            code: data.couponCode,
            subtotal,
            shippingAmount,
          });
        discountAmount = couponDiscount;
        appliedCouponCode = coupon.code;
      } catch (error) {
        if (error instanceof CouponError) {
          return NextResponse.json(
            { success: false, error: error.code, message: error.message },
            { status: 400 },
          );
        }
        throw error;
      }
    }

    const totalAmount = roundCurrency(
      subtotal +
        taxAmount +
        shippingAmount +
        dutyAmount +
        insuranceAmount -
        discountAmount,
    );

    // 使用数据库事务创建订单
    const order = await prisma.$transaction(
      async tx => {
        // 创建订单
        const newOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: session.user.id,
            status: 'PENDING',
          currency: market?.currency ?? 'USD',
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount,
            totalAmount,
            declaredValue,
            dutyAmount,
            importTaxAmount: taxAmount,
            insuranceAmount,
            couponCode: appliedCouponCode,
            shippingAddressId: data.shippingAddressId,
            billingAddressId: data.billingAddressId,
            notes: data.notes,
            marketId: market?.id,
            shippingZoneId: shippingZone?.id,
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
          if (item.trackInventory && !item.allowOutOfStock) {
            const inventory = item.variantId
              ? await tx.inventory.findUnique({
                  where: { variantId: item.variantId },
                })
              : await tx.inventory.findUnique({
                  where: { productId: item.productId },
                });

            if (
              !inventory ||
              inventory.quantity - inventory.reservedQuantity < item.quantity
            ) {
              throw new Error('INSUFFICIENT_STOCK');
            }

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

        return newOrder;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    console.log('订单创建成功:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: session.user.id,
      totalAmount,
      itemCount: validatedItems.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: '订单创建成功',
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          dutyAmount: order.dutyAmount,
          shippingAmount: order.shippingAmount,
          insuranceAmount: order.insuranceAmount,
          discountAmount: order.discountAmount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('创建订单失败:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'TRANSACTION_CONFLICT',
          message: '库存或优惠券状态刚刚发生变化，请刷新后重试',
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          message: '库存刚刚发生变化，请刷新后重试',
        },
        { status: 409 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}
