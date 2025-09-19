/** @type {import('next').NextConfig} */
const nextConfig = {
  // 编译配置
  reactStrictMode: true,
  swcMinify: true,
  
  // 实验性功能
  experimental: {
    // 启用App Directory
    appDir: true,
    // Turbopack支持
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // 服务器组件优化
    serverComponentsExternalPackages: ['@prisma/client'],
    // 静态生成优化
    optimizeCss: true,
    optimizePackageImports: ['antd', 'date-fns', 'lodash'],
  },

  // 图像优化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [
      'localhost',
      'yoyo-mall.vercel.app',
      // 阿里云OSS域名
      'yoyo-mall-assets.oss-cn-hangzhou.aliyuncs.com',
      // 其他图片域名
      'picsum.photos',
      'via.placeholder.com',
    ],
  },

  // 压缩配置
  compress: true,

  // 输出配置
  output: 'standalone',

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/shop',
        destination: '/products',
        permanent: true,
      },
    ];
  },

  // 重写配置
  async rewrites() {
    return [
      {
        source: '/api/stripe/webhook',
        destination: '/api/payments/stripe/webhook',
      },
    ];
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // Webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 性能优化
    if (!dev && !isServer) {
      // 代码分割
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          antd: {
            name: 'antd',
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            priority: 20,
            chunks: 'all',
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      };

      // Bundle分析
      if (process.env.ANALYZE) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: `../bundle-analyzer/client.html`,
          })
        );
      }
    }

    // 别名配置
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },

  // ESLint配置
  eslint: {
    ignoreDuringBuilds: true, // 在构建时忽略ESLint错误
    dirs: ['src'], // 只在src目录运行ESLint
  },

  // TypeScript配置
  typescript: {
    ignoreBuildErrors: true, // 在构建时忽略TypeScript错误（生产环境不推荐）
  },

  // 国际化配置
  i18n: {
    locales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    defaultLocale: 'zh-CN',
    localeDetection: true,
  },

  // 安全头部
  async generateBuildId() {
    // 自定义构建ID
    return `build-${Date.now()}`;
  },
};

// 导入path模块
import path from 'path';

export default nextConfig;
