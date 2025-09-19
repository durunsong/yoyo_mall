import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, mapStripeStatusToOrderStatus } from '@/lib/stripe';

// Stripe Webhook处理器
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('缺少Stripe签名');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('缺少STRIPE_WEBHOOK_SECRET环境变量');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // 验证webhook签名
    const verificationResult = verifyWebhookSignature(body, signature, webhookSecret);
    
    if (!verificationResult.success) {
      console.error('Webhook签名验证失败:', verificationResult.error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = verificationResult.data;
    
    console.log('收到Stripe Webhook事件:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000),
    });

    // 处理不同类型的事件
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
        
      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object);
        break;
        
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;

      default:
        console.log(`未处理的事件类型: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook处理失败:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// 处理支付成功
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('支付成功事件缺少orderId:', paymentIntent.id);
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 更新支付状态
      await tx.payment.updateMany({
        where: {
          providerTransactionId: paymentIntent.id,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        data: {
          status: 'COMPLETED',
          metadata: {
            stripeStatus: paymentIntent.status,
            completedAt: new Date().toISOString(),
          },
        },
      });

      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });

      // 发送确认邮件等后续操作可以在这里处理
      console.log('支付成功处理完成:', {
        paymentIntentId: paymentIntent.id,
        orderId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      });
    });
  } catch (error) {
    console.error('处理支付成功事件失败:', error);
  }
}

// 处理支付失败
async function handlePaymentFailed(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('支付失败事件缺少orderId:', paymentIntent.id);
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 更新支付状态
      await tx.payment.updateMany({
        where: {
          providerTransactionId: paymentIntent.id,
        },
        data: {
          status: 'FAILED',
          metadata: {
            stripeStatus: paymentIntent.status,
            failedAt: new Date().toISOString(),
            lastError: paymentIntent.last_payment_error?.message || 'Unknown error',
          },
        },
      });

      // 获取订单详情以释放库存
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: { select: { trackInventory: true } },
            },
          },
        },
      });

      if (order) {
        // 更新订单状态
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });

        // 释放预留库存
        for (const item of order.items) {
          if (item.product.trackInventory) {
            if (item.variantId) {
              await tx.inventory.updateMany({
                where: { variantId: item.variantId },
                data: {
                  reservedQuantity: { decrement: item.quantity },
                },
              });
            } else {
              await tx.inventory.updateMany({
                where: { productId: item.productId },
                data: {
                  reservedQuantity: { decrement: item.quantity },
                },
              });
            }
          }
        }
      }

      console.log('支付失败处理完成:', {
        paymentIntentId: paymentIntent.id,
        orderId,
        error: paymentIntent.last_payment_error?.message,
      });
    });
  } catch (error) {
    console.error('处理支付失败事件失败:', error);
  }
}

// 处理支付取消
async function handlePaymentCanceled(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('支付取消事件缺少orderId:', paymentIntent.id);
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 更新支付状态
      await tx.payment.updateMany({
        where: {
          providerTransactionId: paymentIntent.id,
        },
        data: {
          status: 'CANCELLED',
          metadata: {
            stripeStatus: paymentIntent.status,
            canceledAt: new Date().toISOString(),
          },
        },
      });

      // 获取订单详情以释放库存
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: { select: { trackInventory: true } },
            },
          },
        },
      });

      if (order) {
        // 更新订单状态
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });

        // 释放预留库存
        for (const item of order.items) {
          if (item.product.trackInventory) {
            if (item.variantId) {
              await tx.inventory.updateMany({
                where: { variantId: item.variantId },
                data: {
                  reservedQuantity: { decrement: item.quantity },
                },
              });
            } else {
              await tx.inventory.updateMany({
                where: { productId: item.productId },
                data: {
                  reservedQuantity: { decrement: item.quantity },
                },
              });
            }
          }
        }
      }

      console.log('支付取消处理完成:', {
        paymentIntentId: paymentIntent.id,
        orderId,
      });
    });
  } catch (error) {
    console.error('处理支付取消事件失败:', error);
  }
}

// 处理需要额外操作的支付
async function handlePaymentRequiresAction(paymentIntent: any) {
  try {
    await prisma.payment.updateMany({
      where: {
        providerTransactionId: paymentIntent.id,
      },
      data: {
        status: 'PROCESSING',
        metadata: {
          stripeStatus: paymentIntent.status,
          requiresAction: true,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    console.log('支付需要额外操作:', {
      paymentIntentId: paymentIntent.id,
      nextAction: paymentIntent.next_action?.type,
    });
  } catch (error) {
    console.error('处理支付需要额外操作事件失败:', error);
  }
}

// 处理争议
async function handleChargeDispute(dispute: any) {
  try {
    const paymentIntentId = dispute.payment_intent;
    
    // 记录争议信息
    console.log('收到支付争议:', {
      disputeId: dispute.id,
      paymentIntentId,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      status: dispute.status,
    });

    // 可以在这里添加争议处理逻辑
    // 例如：发送邮件通知管理员、更新订单状态等
    
  } catch (error) {
    console.error('处理争议事件失败:', error);
  }
}
