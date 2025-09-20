/**
 * Stripe支付服务配置
 * 处理支付相关的所有操作
 */

import Stripe from 'stripe';

// 创建Stripe实例
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('缺少STRIPE_SECRET_KEY环境变量');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-20.acacia',
  typescript: true,
});

// 支付方法映射
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'card',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
} as const;

// 货币映射
export const SUPPORTED_CURRENCIES = {
  USD: 'usd',
  EUR: 'eur',
  GBP: 'gbp',
  JPY: 'jpy',
  CNY: 'cny',
} as const;

// 创建支付意图
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  orderId,
  customerId,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  try {
    // 将金额转换为最小货币单位（分）
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        orderId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // 设置收据邮箱
      ...(customerId && { receipt_email: undefined }), // 会自动使用客户的邮箱
    });

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    };
  } catch (error) {
    console.error('创建支付意图失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// 确认支付
export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error) {
    console.error('确认支付失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// 创建退款
export async function createRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
  metadata = {},
}: {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // 如果不指定金额则全额退款
      reason,
      metadata,
    });

    return {
      success: true,
      data: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        created: refund.created,
      },
    };
  } catch (error) {
    console.error('创建退款失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// 创建或获取Stripe客户
export async function getOrCreateStripeCustomer({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string;
}) {
  try {
    // 首先尝试通过元数据查找现有客户
    const existingCustomers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
    });

    if (existingCustomers.data.length > 0) {
      return {
        success: true,
        data: existingCustomers.data[0],
      };
    }

    // 如果没有找到，创建新客户
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    });

    return {
      success: true,
      data: customer,
    };
  } catch (error) {
    console.error('获取或创建Stripe客户失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// 验证webhook签名
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
) {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return { success: true, data: event };
  } catch (error) {
    console.error('Webhook签名验证失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '签名验证失败',
    };
  }
}

// 处理支付状态映射
export function mapStripeStatusToOrderStatus(stripeStatus: string) {
  const statusMap: Record<string, string> = {
    'requires_payment_method': 'PENDING',
    'requires_confirmation': 'PENDING',
    'requires_action': 'PENDING',
    'processing': 'PROCESSING',
    'requires_capture': 'CONFIRMED',
    'succeeded': 'CONFIRMED',
    'canceled': 'CANCELLED',
  };

  return statusMap[stripeStatus] || 'PENDING';
}

// 格式化金额显示
export function formatStripeAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
