import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // 启用实验性功能
  },
  eslint: {
    // 临时跳过ESLint检查，待修复完所有警告后移除
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略TypeScript错误（仅用于紧急部署）
    ignoreBuildErrors: false,
  },
  images: {
    // 图片优化配置
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
