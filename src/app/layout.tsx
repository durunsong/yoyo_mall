// React 19 兼容性已通过shadcn/ui处理

import type { Metadata } from 'next';
import './globals.css';
import { RootProviders } from '@/components/providers/root-providers';
import { ConditionalLayout } from '@/components/layout/conditional-layout';

// 使用系统字体栈，避免Google Fonts网络问题
const fontSans = {
  variable: '--font-sans',
};

export const metadata: Metadata = {
  title: {
    default: 'Yobuy - 跨境电商购物平台',
    template: '%s | Yobuy',
  },
  description: '专业的跨境电商平台，提供全球优质商品，安全便捷的购物体验',
  keywords: ['跨境电商', '网上购物', '全球商品', '安全支付', '电子商务'],
  authors: [{ name: 'Yobuy Team' }],
  creator: 'Yobuy',
  // 动态获取应用URL，优先使用环境变量，其次使用 Vercel URL，最后才用 localhost
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  ),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: './',
    title: 'Yobuy - 跨境电商购物平台',
    description: '专业的跨境电商平台，提供全球优质商品，安全便捷的购物体验',
    siteName: 'Yobuy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yobuy - 跨境电商购物平台',
    description: '专业的跨境电商平台，提供全球优质商品，安全便捷的购物体验',
  },
  icons: {
    icon: '/icons/web-icon.svg',
    shortcut: '/icons/web-icon.svg',
    apple: '/icons/web-icon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <RootProviders>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </RootProviders>
      </body>
    </html>
  );
}
