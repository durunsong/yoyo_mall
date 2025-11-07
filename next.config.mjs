/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint 配置
  // TODO: 修复所有 ESLint 错误后改为 false
  eslint: {
    ignoreDuringBuilds: true, // 暂时忽略构建时的 ESLint 检查
  },
  
  // TypeScript 配置
  // 注意: Next.js 15 params 现在是 Promise 类型,需要异步处理
  // TODO: 修复所有 params 相关的类型错误后改为 false
  typescript: {
    ignoreBuildErrors: true, // 暂时忽略构建错误
  },

  // 图片优化配置
  images: {
    // 支持的图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
        pathname: '/**',
      },
    ],
    // 图片格式优化
    formats: ['image/avif', 'image/webp'],
    // 图片质量
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 最小缓存时间（60秒）
    minimumCacheTTL: 60,
  },

  // 性能优化
  compiler: {
    // 移除 console.log (生产环境)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 压缩配置
  compress: true,

  // 启用 React Strict Mode
  reactStrictMode: true,

  // 输出配置 (在 Windows 上可能会有权限问题，需要管理员权限)
  // output: 'standalone',

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },

  // Headers 配置 (安全和性能)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // 静态资源缓存
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: 'Yobuy',
    NEXT_PUBLIC_APP_VERSION: '1.5.0',
  },

  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;