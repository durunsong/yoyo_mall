// 引入React 19兼容包 - 必须在所有 Ant Design 导入之前
import '@ant-design/v5-patch-for-react-19';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AntdHeader } from "@/components/layout/antd-header";
import { Footer } from "@/components/layout/footer";
import { RootProviders } from "@/components/providers/root-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "YOYO Mall - 跨境电商购物平台",
    template: "%s | YOYO Mall",
  },
  description: "专业的跨境电商平台，提供全球优质商品，安全便捷的购物体验",
  keywords: ["跨境电商", "网上购物", "全球商品", "安全支付", "电子商务"],
  authors: [{ name: "YOYO Mall Team" }],
  creator: "YOYO Mall",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "./",
    title: "YOYO Mall - 跨境电商购物平台",
    description: "专业的跨境电商平台，提供全球优质商品，安全便捷的购物体验",
    siteName: "YOYO Mall",
  },
  twitter: {
    card: "summary_large_image",
    title: "YOYO Mall - 跨境电商购物平台",
    description: "专业的跨境电商平台，提供全球优质商品，安全便捷的购物体验",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <RootProviders>
          <div className="relative flex min-h-screen flex-col">
            <AntdHeader />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </RootProviders>
      </body>
    </html>
  );
}
