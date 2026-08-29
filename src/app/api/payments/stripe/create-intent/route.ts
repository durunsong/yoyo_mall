import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  confirmPayment,
  createPaymentIntent,
  getOrCreateStripeCustomer,
} from '@/lib/stripe';
import { isPaymentIntentAmountMatching } from '@/lib/payments/stripe-transition';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// 创建支付意图验证
const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1, '订单ID不能为空'),
  returnUrl: z.string().url('返回URL格式不正确').optional(),
});

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
    const { orderId, returnUrl } = createPaymentIntentSchema.parse(body);

    // 获取订单详情
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'ORDER_NOT_FOUND', message: '订单不存在' },
        { status: 404 },
      );
    }

    // 检查订单状态
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ORDER_STATUS',
          message: `订单状态为 ${order.status}，无法支付`,
        },
        { status: 400 },
      );
    }

    // 检查是否已有未完成的支付记录
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingPayment && existingPayment.providerTransactionId) {
      const existingMetadata = isRecord(existingPayment.metadata)
        ? existingPayment.metadata
        : {};
      let clientSecret =
        typeof existingMetadata.clientSecret === 'string'
          ? existingMetadata.clientSecret
          : null;

      if (!clientSecret) {
        const existingIntent = await confirmPayment(
          existingPayment.providerTransactionId,
        );
        if (!existingIntent.success || !existingIntent.data) {
          return NextResponse.json(
            {
              success: false,
              error: 'PAYMENT_INTENT_UNAVAILABLE',
              message: '支付意图已失效，请重新发起支付',
            },
            { status: 409 },
          );
        }
        if (
          !isPaymentIntentAmountMatching({
            stripeAmountInMinorUnits: existingIntent.data.amount,
            storedAmount: Number(order.totalAmount),
            stripeCurrency: existingIntent.data.currency,
            storedCurrency: order.currency,
          })
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'PAYMENT_AMOUNT_MISMATCH',
              message: '支付金额已变化，请重新下单',
            },
            { status: 409 },
          );
        }
        clientSecret = existingIntent.data.clientSecret;
        if (clientSecret) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { metadata: { ...existingMetadata, clientSecret } },
          });
        }
      }

      if (!clientSecret) {
        return NextResponse.json(
          {
            success: false,
            error: 'PAYMENT_INTENT_UNAVAILABLE',
            message: '支付意图缺少客户端密钥，请重试',
          },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        message: '使用现有支付意图',
        data: {
          clientSecret,
          paymentId: existingPayment.id,
          paymentIntentId: existingPayment.providerTransactionId,
          amount: Number(order.totalAmount),
          currency: order.currency,
        },
      });
    }

    // 获取或创建Stripe客户
    const customerResult = await getOrCreateStripeCustomer({
      userId: session.user.id,
      email: order.user.email!,
      name: order.user.name || undefined,
    });

    if (!customerResult.success || !customerResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'CUSTOMER_CREATION_FAILED',
          message: '创建支付客户失败',
        },
        { status: 500 },
      );
    }

    // 创建支付意图
    const paymentIntentResult = await createPaymentIntent({
      amount: Number(order.totalAmount),
      currency: order.currency.toLowerCase(),
      orderId: order.id,
      customerId: customerResult.data.id,
      metadata: {
        userId: session.user.id,
        orderNumber: order.orderNumber,
        itemCount: order.items.length.toString(),
      },
      idempotencyKey: `order:${order.id}`,
    });

    if (!paymentIntentResult.success || !paymentIntentResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_INTENT_FAILED',
          message: '创建支付意图失败',
          details: paymentIntentResult.error,
        },
        { status: 500 },
      );
    }

    if (!paymentIntentResult.data.clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_INTENT_UNAVAILABLE',
          message: '支付意图缺少客户端密钥，请重试',
        },
        { status: 502 },
      );
    }

    // 在数据库中记录支付记录
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        paymentMethod: 'CREDIT_CARD',
        provider: 'stripe',
        providerTransactionId: paymentIntentResult.data.paymentIntentId,
        amount: Number(order.totalAmount),
        currency: order.currency,
        status: 'PENDING',
        metadata: {
          clientSecret: paymentIntentResult.data.clientSecret,
          customerId: customerResult.data.id,
          returnUrl,
        },
      },
    });

    console.log('支付意图创建成功:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      paymentIntentId: paymentIntentResult.data.paymentIntentId,
      amount: Number(order.totalAmount),
      currency: order.currency,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: '支付意图创建成功',
      data: {
        clientSecret: paymentIntentResult.data.clientSecret,
        paymentId: payment.id,
        paymentIntentId: paymentIntentResult.data.paymentIntentId,
        amount: Number(order.totalAmount),
        currency: order.currency,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          itemCount: order.items.length,
          items: order.items.map(item => ({
            name: item.product?.name ?? '未知商品',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
    });
  } catch (error) {
    console.error('创建支付意图失败:', error);

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
