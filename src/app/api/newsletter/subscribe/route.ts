/**
 * Newsletter 订阅 API
 * POST - 订阅 Newsletter
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { WelcomeEmailTemplate } from '@/lib/email-templates';
import crypto from 'crypto';

// 订阅表单验证
const subscribeSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  source: z.string().optional().default('footer'),
});

export async function POST(request: NextRequest) {
  try {
    // 检查 Resend 配置
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY 未配置');
      return NextResponse.json(
        {
          success: false,
          error: 'CONFIG_ERROR',
          message: '邮件服务未配置，请联系管理员',
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { email, source } = subscribeSchema.parse(body);

    // 检查邮箱是否已订阅
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      // 如果已经是激活状态
      if (existing.status === 'ACTIVE') {
        return NextResponse.json(
          {
            success: false,
            error: 'ALREADY_SUBSCRIBED',
            message: '该邮箱已订阅',
          },
          { status: 400 },
        );
      }

      // 如果之前取消订阅，允许重新订阅
      if (existing.status === 'UNSUBSCRIBED') {
        // 生成新的验证 token
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            verifyToken,
            unsubscribeToken,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            confirmedAt: null,
          },
        });

        // 发送验证邮件
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/verify?token=${verifyToken}`;
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

        await sendEmail({
          to: email,
          subject: '欢迎订阅 YOYO Mall 新闻通讯',
          html: WelcomeEmailTemplate({
            verifyUrl,
            unsubscribeUrl,
          }),
        });

        return NextResponse.json({
          success: true,
          message: '请查收验证邮件以完成订阅',
        });
      }

      // 如果还在待验证状态，重新发送验证邮件
      if (existing.status === 'PENDING' && existing.verifyToken && existing.unsubscribeToken) {
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/verify?token=${existing.verifyToken}`;
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?token=${existing.unsubscribeToken}`;

        await sendEmail({
          to: email,
          subject: '欢迎订阅 YOYO Mall 新闻通讯',
          html: WelcomeEmailTemplate({
            verifyUrl,
            unsubscribeUrl,
          }),
        });

        return NextResponse.json({
          success: true,
          message: '验证邮件已重新发送，请查收',
        });
      }
    }

    // 创建新订阅
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        source,
        verifyToken,
        unsubscribeToken,
        status: 'PENDING',
      },
    });

    // 发送欢迎邮件
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/verify?token=${verifyToken}`;
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

    const emailResult = await sendEmail({
      to: email,
      subject: '欢迎订阅 YOYO Mall 新闻通讯',
      html: WelcomeEmailTemplate({
        verifyUrl,
        unsubscribeUrl,
      }),
    });

    if (!emailResult.success) {
      console.error('发送验证邮件失败:', emailResult.error);
      // 即使邮件发送失败，也返回成功，避免暴露系统信息
    }

    console.log('Newsletter 订阅成功:', { email, source });

    return NextResponse.json({
      success: true,
      message: '订阅成功！请查收验证邮件以完成订阅',
    });
  } catch (error) {
    console.error('Newsletter 订阅失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请输入有效的邮箱地址',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '订阅失败，请稍后重试',
      },
      { status: 500 },
    );
  }
}

