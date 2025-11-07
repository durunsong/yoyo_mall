/**
 * Newsletter 取消订阅 API
 * GET - 取消订阅
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { UnsubscribeEmailTemplate } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/newsletter/unsubscribe-error?reason=missing_token', request.url),
      );
    }

    // 查找订阅记录
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(
        new URL('/newsletter/unsubscribe-error?reason=invalid_token', request.url),
      );
    }

    // 如果已经取消订阅
    if (subscriber.status === 'UNSUBSCRIBED') {
      return NextResponse.redirect(
        new URL('/newsletter/already-unsubscribed', request.url),
      );
    }

    // 更新订阅状态为取消
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });

    // 发送取消订阅确认邮件
    await sendEmail({
      to: subscriber.email,
      subject: 'Yobuy - 取消订阅确认',
      html: UnsubscribeEmailTemplate({}),
    });

    console.log('Newsletter 取消订阅成功:', subscriber.email);

    // 重定向到成功页面
    return NextResponse.redirect(
      new URL('/newsletter/unsubscribe-success', request.url),
    );
  } catch (error) {
    console.error('Newsletter 取消订阅失败:', error);
    return NextResponse.redirect(
      new URL('/newsletter/unsubscribe-error?reason=server_error', request.url),
    );
  }
}

