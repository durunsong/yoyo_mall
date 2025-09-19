import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // 支持的语言列表
  locales,
  
  // 默认语言
  defaultLocale,
  
  // 语言检测策略
  localeDetection: true,
  
  // 路径名配置
  pathnames: {
    '/': '/',
    '/products': '/products',
    '/cart': '/cart',
    '/checkout': '/checkout',
    '/login': '/login',
    '/register': '/register',
    '/profile': '/profile',
    '/admin': '/admin'
  }
});

export const config = {
  // 匹配所有路径，除了以下这些：
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};