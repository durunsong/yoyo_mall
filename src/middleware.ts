/**
 * Next.js 中间件
 * 处理国际化路由和其他中间件逻辑
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // 支持的语言列表
  locales,
  
  // 默认语言
  defaultLocale,
  
  // 路径配置
  localePrefix: 'as-needed', // 默认语言不显示前缀
  
  // 备用语言检测
  alternateLinks: true,
  
  // 语言检测策略
  localeDetection: true,
});

export const config = {
  // 匹配除了这些路径之外的所有路径
  matcher: [
    // 启用对所有文件的处理...
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|admin).*)',
    // 但是排除内部 Next.js 文件
  ],
};
