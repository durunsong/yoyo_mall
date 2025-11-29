import { NextRequest, NextResponse } from 'next/server';
import { AdminEmailSendType, AdminEmailStatus } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { getSystemSettings } from '@/lib/server/system-settings';
import { buildComplianceFooter } from '@/lib/email/compliance';

const MAX_RECIPIENTS = 500;
const chunkSize = 25;

const payloadSchema = z.object({
  subject: z.string().min(5).max(150),
  htmlContent: z.string().min(20),
  recipientType: z.enum(['SINGLE', 'MULTI', 'ALL']),
  recipientIds: z.array(z.string()).optional(),
  complianceAccepted: z.boolean().refine(val => val === true, {
    message: '发送前必须确认合规声明',
  }),
  additionalNotes: z.string().max(200).optional(),
});

function stripHtml(input: string) {
  return input.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s+\n/g, '\n').trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const sendType = payload.recipientType as AdminEmailSendType;

    let recipientFilterIds: string[] | undefined =
      sendType === 'ALL' ? undefined : Array.from(new Set(payload.recipientIds ?? []));

    if ((sendType === 'SINGLE' || sendType === 'MULTI') && (!recipientFilterIds || recipientFilterIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: '请选择至少一个收件人' },
        { status: 400 },
      );
    }

    if (sendType === 'SINGLE' && recipientFilterIds && recipientFilterIds.length !== 1) {
      return NextResponse.json(
        { success: false, error: '单发模式仅允许选择一个收件人' },
        { status: 400 },
      );
    }

    const whereClause =
      sendType === 'ALL'
        ? {
            role: {
              in: ['CUSTOMER', 'GUEST'],
            },
          }
        : {
            id: { in: recipientFilterIds },
          };

    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: MAX_RECIPIENTS + 1,
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到可发送的收件人' },
        { status: 404 },
      );
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        {
          success: false,
          error: `请分批发送：单次最多支持 ${MAX_RECIPIENTS} 位收件人`,
        },
        { status: 400 },
      );
    }

    const systemSettings = await getSystemSettings();
    const sanitizedBody = sanitizeHtml(payload.htmlContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img',
        'h1',
        'h2',
        'h3',
        'figure',
        'figcaption',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
        'span',
        'div',
      ]),
      allowedAttributes: {
        a: ['href', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['style', 'class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowProtocolRelative: true,
    });

    const compliance = buildComplianceFooter({
      settings: systemSettings,
      additionalNotes: payload.additionalNotes,
    });

    const finalHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.7;">
        ${sanitizedBody}
        ${compliance.html}
      </div>
    `.trim();

    const plainTextBody = `${stripHtml(sanitizedBody)}\n\n${compliance.text}`;

    const deliveryResults: Array<{ email: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < recipients.length; i += chunkSize) {
      const batch = recipients.slice(i, i + chunkSize);
      const batchResults = await Promise.all(
        batch.map(async recipient => {
          const toLabel = recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email;
          const response = await sendEmail({
            to: toLabel,
            subject: payload.subject,
            html: finalHtml,
            text: plainTextBody,
          });

          return {
            email: recipient.email,
            success: response.success,
            error: response.success ? undefined : response.error,
          };
        }),
      );

      deliveryResults.push(...batchResults);
    }

    const successCount = deliveryResults.filter(r => r.success).length;
    const failureEntries = deliveryResults.filter(r => !r.success);
    const failureCount = failureEntries.length;

    const finalStatus: AdminEmailStatus =
      failureCount === 0
        ? AdminEmailStatus.SUCCESS
        : successCount === 0
          ? AdminEmailStatus.FAILED
          : AdminEmailStatus.PARTIAL;

    const failureReason =
      failureEntries.length > 0
        ? failureEntries
            .slice(0, 5)
            .map(entry => `${entry.email}: ${entry.error || '未知错误'}`)
            .join('; ')
        : null;

    const log = await prisma.adminEmailLog.create({
      data: {
        subject: payload.subject,
        content: plainTextBody,
        htmlContent: finalHtml,
        complianceInfo: compliance.meta,
        sendType,
        status: finalStatus,
        recipientCount: recipients.length,
        successCount,
        failureCount,
        failureReason,
        recipients: recipients.map(recipient => ({
          id: recipient.id,
          email: recipient.email,
          name:
            recipient.name ||
            [recipient.profile?.firstName, recipient.profile?.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() ||
            recipient.email,
        })),
        createdById: admin.id,
      },
    });

    return NextResponse.json({
      success: failureCount === 0,
      data: {
        status: finalStatus,
        successCount,
        failureCount,
        recipientCount: recipients.length,
        logId: log.id,
      },
      message:
        finalStatus === AdminEmailStatus.SUCCESS
          ? '邮件发送成功'
          : finalStatus === AdminEmailStatus.PARTIAL
            ? '部分邮件发送失败，请查看详情'
            : '邮件发送失败，请检查配置',
    });
  } catch (error) {
    console.error('发送后台邮件失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '参数错误', details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: '发送失败，请稍后再试' },
      { status: 500 },
    );
  }
}

