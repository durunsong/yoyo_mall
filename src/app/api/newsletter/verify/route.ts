/**
 * Newsletter 邮箱验证 API
 * GET - 验证邮箱地址
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { ConfirmationEmailTemplate } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/newsletter/verify-error?reason=missing_token', request.url),
      );
    }

    // 查找待验证的订阅
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { verifyToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(
        new URL('/newsletter/verify-error?reason=invalid_token', request.url),
      );
    }

    // 如果已经验证过
    if (subscriber.status === 'ACTIVE') {
      return NextResponse.redirect(
        new URL('/newsletter/already-verified', request.url),
      );
    }

    // 更新订阅状态为激活
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'ACTIVE',
        confirmedAt: new Date(),
        verifyToken: null, // 清除验证 token
      },
    });

    // 发送确认邮件
    if (subscriber.unsubscribeToken) {
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;

      await sendEmail({
        to: subscriber.email,
        subject: 'YOYO Mall - 订阅确认成功',
        html: ConfirmationEmailTemplate({
          unsubscribeUrl,
        }),
      });
    }

    console.log('Newsletter 邮箱验证成功:', subscriber.email);

    // 重定向到成功页面
    return NextResponse.redirect(
      new URL('/newsletter/verify-success', request.url),
    );
  } catch (error) {
    console.error('Newsletter 邮箱验证失败:', error);
    return NextResponse.redirect(
      new URL('/newsletter/verify-error?reason=server_error', request.url),
    );
  }
}

