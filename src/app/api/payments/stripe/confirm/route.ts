import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { confirmPayment } from '@/lib/stripe';
import {
  applyStripePaymentTransition,
  StripePaymentTransitionError,
} from '@/lib/payments/apply-stripe-transition';

// 确认支付验证
const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, '支付意图ID不能为空'),
  paymentId: z.string().min(1, '支付记录ID不能为空'),
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
    const { paymentIntentId, paymentId } = confirmPaymentSchema.parse(body);

    // 获取支付记录
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        providerTransactionId: paymentIntentId,
      },
      include: {
        order: {
          include: {
            user: { select: { id: true, email: true, name: true } },
            items: {
              include: {
                product: { select: { name: true, trackInventory: true } },
                variant: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: '支付记录不存在',
        },
        { status: 404 },
      );
    }

    // 验证订单所有者
    if (payment.order.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '无权限访问此支付记录',
        },
        { status: 403 },
      );
    }

    // 从Stripe确认支付状态
    const stripeResult = await confirmPayment(paymentIntentId);

    if (!stripeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'STRIPE_ERROR',
          message: '获取支付状态失败',
          details: stripeResult.error,
        },
        { status: 500 },
      );
    }

    if (!stripeResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'STRIPE_ERROR',
          message: '未能获取支付详情',
        },
        { status: 500 },
      );
    }

    const stripePayment = stripeResult.data;
    const result = await prisma.$transaction(
      async tx =>
        applyStripePaymentTransition(tx, {
          paymentId: payment.id,
          paymentIntentId,
          eventType: `payment_intent.${stripePayment.status === 'requires_payment_method' ? 'requires_payment_method' : stripePayment.status}`,
          stripeStatus: stripePayment.status,
          stripeAmountInMinorUnits: stripePayment.amount,
          stripeCurrency: stripePayment.currency,
          lastPaymentError: undefined,
        }),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    console.log('支付状态更新成功:', {
      paymentId: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      stripeStatus: stripePayment.status,
      newPaymentStatus: result.paymentStatus,
      newOrderStatus: result.orderStatus,
      amount: stripePayment.amount / 100,
      currency: stripePayment.currency,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: '支付状态确认成功',
      data: {
        payment: {
          id: result.paymentId,
          status: result.paymentStatus,
          amount: stripePayment.amount / 100,
          currency: stripePayment.currency,
        },
        order: {
          id: result.orderId,
          orderNumber: payment.order.orderNumber,
          status: result.orderStatus,
        },
        stripe: {
          paymentIntentId: stripePayment.id,
          status: stripePayment.status,
          created: new Date(stripePayment.created * 1000),
        },
        nextSteps: getNextSteps(stripePayment.status),
      },
    });
  } catch (error) {
    console.error('确认支付失败:', error);

    if (error instanceof StripePaymentTransitionError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.code === 'PAYMENT_NOT_FOUND' ? 404 : 409 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'TRANSACTION_CONFLICT',
          message: '支付状态刚刚发生变化，请刷新订单后重试',
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

// 根据支付状态返回后续步骤提示
function getNextSteps(stripeStatus: string) {
  const steps: Record<string, string[]> = {
    succeeded: [
      '支付成功！',
      '订单已确认，我们将尽快为您发货',
      '您可以在订单历史中查看订单详情',
    ],
    processing: [
      '支付正在处理中',
      '请耐心等待，通常需要几分钟时间',
      '我们会通过邮件通知您支付结果',
    ],
    requires_action: [
      '需要额外验证',
      '请按照提示完成验证步骤',
      '验证完成后支付将自动处理',
    ],
    canceled: [
      '支付已取消',
      '订单将被取消，库存已释放',
      '如需重新购买，请重新下单',
    ],
    failed: [
      '支付失败',
      '请检查支付信息或尝试其他支付方式',
      '如有疑问，请联系客服',
    ],
  };

  return steps[stripeStatus] || ['支付状态未知，请联系客服'];
}
