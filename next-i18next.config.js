/** @type {import('next-i18next').UserConfig} */
const config = {
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    localeDetection: false, // 禁用自动语言检测，避免URL变化
  },
  localePath: './src/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  
  // 调试配置
  debug: process.env.NODE_ENV === 'development',
  
  // 命名空间配置
  ns: ['common', 'navigation', 'product', 'cart', 'auth', 'admin', 'error'],
  defaultNS: 'common',
  
  // 插值配置
  interpolation: {
    escapeValue: false, // React已经转义了
  },
  
  // 后端选项
  backend: {
    loadPath: './src/locales/{{lng}}/{{ns}}.json',
  },
  
  // 保存缺失的翻译
  saveMissing: false,
  
  // 使用悬疑模式
  react: {
    useSuspense: false, // 避免SSR问题
  },
};

export default config;
