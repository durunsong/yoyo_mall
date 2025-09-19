/**
 * 国际化配置
 * 使用next-intl进行多语言支持
 */

// import { notFound } from 'next/navigation'; // 暂时未使用
import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表
export const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh-CN';

export default getRequestConfig(async ({ requestLocale }) => {
  // 等待并获取请求的语言
  let locale = await requestLocale;

  // 如果没有语言，使用默认语言
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
