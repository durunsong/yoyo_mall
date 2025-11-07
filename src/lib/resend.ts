/**
 * Resend 邮件服务配置
 * 官方文档: https://resend.com/docs/introduction
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY 未配置，邮件功能将无法使用');
}

// 初始化 Resend 客户端
export const resend = new Resend(process.env.RESEND_API_KEY);

// 默认发件人配置
export const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Yobuy <noreply@yoyomall.com>';

/**
 * 发送邮件的辅助函数
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 批量发送邮件
 */
export async function sendBatchEmails({
  emails,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
}: {
  emails: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  try {
    // Resend 支持批量发送，但建议分批处理避免超时
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email =>
          sendEmail({
            to: email,
            subject,
            html,
            text,
            from,
          }),
        ),
      );
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: true,
      successCount,
      failureCount,
      total: results.length,
    };
  } catch (error) {
    console.error('批量发送邮件失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

