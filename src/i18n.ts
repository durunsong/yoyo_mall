import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表
export const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'] as const;
export const defaultLocale = 'zh-CN' as const;

export default getRequestConfig(async ({ locale }) => {
  // 验证请求的locale是否在支持的列表中
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});