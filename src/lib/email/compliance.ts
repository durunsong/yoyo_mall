/**
 * 邮件合规相关的辅助函数
 * 负责生成跨境电商所需的合规说明、退订提示等内容
 */

import { SystemSettings, defaultSystemSettings } from '@/lib/settings/system-settings';

export interface EmailComplianceMeta extends Record<string, string | null> {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  contactPhone: string | null;
  unsubscribeUrl: string;
  generatedAt: string;
}

interface ComplianceFooterOptions {
  settings?: Partial<SystemSettings>;
  unsubscribeUrl?: string;
  additionalNotes?: string;
}

/**
 * 构建 HTML 与纯文本格式的合规尾注
 */
export function buildComplianceFooter(
  options: ComplianceFooterOptions = {},
): {
  html: string;
  text: string;
  meta: EmailComplianceMeta;
} {
  const mergedSettings: SystemSettings = {
    ...defaultSystemSettings,
    ...options.settings,
  };

  const siteUrl =
    options.unsubscribeUrl?.replace(/\/newsletter\/unsubscribe.*$/, '') ||
    mergedSettings.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://yoyomall.com';

  const unsubscribeUrl =
    options.unsubscribeUrl ||
    `${siteUrl.replace(/\/$/, '')}/newsletter/unsubscribe`;

  const contactEmail = mergedSettings.contactEmail || 'compliance@yoyomall.com';
  const contactPhone = mergedSettings.contactPhone;
  const additionalNotes = options.additionalNotes?.trim();

  const baseHtml = `
    <div style="margin-top:32px;padding:20px;background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;font-size:12px;color:#475569;line-height:1.7;">
      <p style="margin:0 0 8px;font-weight:600;font-size:13px;color:#0f172a;">合规提示 · Cross-border Compliance</p>
      <p style="margin:0 0 8px;">
        本邮件由 <strong>${mergedSettings.siteName}</strong> (${siteUrl}) 发送，适用《跨境电子商务零售进口商品清单管理办法》等相关法规。
        邮件内容仅面向授权用户，禁止外传。
      </p>
      <p style="margin:0 0 8px;">
        客服及隐私合规联系方式：<a href="mailto:${contactEmail}" style="color:#2563eb;">${contactEmail}</a>
        ${contactPhone ? ` | 客服热线：${contactPhone}` : ''}
      </p>
      <p style="margin:0 0 8px;">
        如您不希望继续接收此类邮件，请 <a href="${unsubscribeUrl}" style="color:#2563eb;">点击这里退订</a>，
        或回复邮件主题包含“退订”字样，我们会在 48 小时内处理。
      </p>
      ${
        additionalNotes
          ? `<p style="margin:0 0 8px;">${additionalNotes}</p>`
          : ''
      }
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">
        本邮件可能包含促销或商业信息，若您在他国/地区阅读，请自行遵守当地法律。
      </p>
    </div>
  `.trim();

  const baseText = [
    '—— 合规提示 · Cross-border Compliance ——',
    `发送方：${mergedSettings.siteName} (${siteUrl})`,
    `联系方式：${contactEmail}${contactPhone ? ` / ${contactPhone}` : ''}`,
    '若不想再收到此类邮件，请访问退订链接或直接回复“退订”，我们会在 48 小时内处理：',
    unsubscribeUrl,
    additionalNotes ? `备注：${additionalNotes}` : undefined,
    '本邮件可能包含跨境商业信息，请遵守所在地法律法规。',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    html: baseHtml,
    text: baseText,
    meta: {
      siteName: mergedSettings.siteName,
      siteUrl,
      contactEmail,
      contactPhone: contactPhone ?? null,
      unsubscribeUrl,
      generatedAt: new Date().toISOString(),
    },
  };
}
