# 404 错误修复说明

## 🐛 问题描述

访问 `http://localhost:3000/` 时出现 404 (Not Found) 错误。

## 🔍 问题原因

项目使用了 `next-intl` 进行国际化配置，但页面文件结构没有按照国际化路由的要求组织。

### 原有结构（错误）
```
src/app/
├── layout.tsx          ❌ 不符合国际化路由结构
├── page.tsx            ❌ 不符合国际化路由结构
└── ...
```

### 国际化配置
- **中间件**: `src/middleware.ts` 配置了 `next-intl/middleware`
- **支持语言**: `['zh-CN', 'en-US', 'ja-JP', 'ko-KR']`
- **默认语言**: `zh-CN`
- **路径前缀**: `as-needed` (默认语言不显示前缀)

## ✅ 解决方案

重新组织文件结构以符合 `next-intl` 的要求：

### 新结构（正确）
```
src/app/
├── layout.tsx              ✅ 根布局（最小化）
├── [locale]/              ✅ 国际化路由文件夹
│   ├── layout.tsx         ✅ 国际化布局
│   ├── page.tsx           ✅ 国际化首页
│   └── ...
└── ...
```

## 🔧 修复步骤

### 1. 创建国际化路由文件夹
```bash
mkdir -p src/app/[locale]
```

### 2. 移动页面文件
```bash
move src/app/page.tsx src/app/[locale]/page.tsx
move src/app/layout.tsx src/app/[locale]/layout.tsx
```

### 3. 创建新的根布局
新建 `src/app/layout.tsx` 作为最小化的根布局：

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";

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
  // ... 其他元数据
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

### 4. 更新国际化布局
修改 `src/app/[locale]/layout.tsx` 以支持国际化：

```tsx
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AntdRegistry>
            <ConfigProvider theme={antdTheme} locale={zhCN}>
              <div className="relative flex min-h-screen flex-col">
                <AntdHeader />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </ConfigProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## 🌐 国际化路由说明

### URL 映射
- `http://localhost:3000/` → 中文页面 (默认语言 zh-CN)
- `http://localhost:3000/en-US/` → 英文页面
- `http://localhost:3000/ja-JP/` → 日文页面
- `http://localhost:3000/ko-KR/` → 韩文页面

### 中间件配置
```ts
export default createMiddleware({
  locales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
  defaultLocale: 'zh-CN',
  localePrefix: 'as-needed', // 默认语言不显示前缀
  localeDetection: true,     // 自动检测用户语言
});
```

## 🎯 结果

修复后：
- ✅ `http://localhost:3000/` 正常显示中文首页
- ✅ 支持多语言路由切换
- ✅ 保持所有功能正常（登录弹窗、导航等）
- ✅ 国际化配置正确工作

## 📝 注意事项

1. **其他页面迁移**: 如需要其他页面也支持国际化，需要将其移动到 `[locale]` 文件夹下
2. **API 路由**: `api/` 路由不受影响，继续在 `src/app/api/` 下
3. **静态文件**: `public/` 文件夹不受影响
4. **语言文件**: 确保 `messages/` 目录下有对应的语言文件

## 🔗 相关文档

- [Next.js 国际化](https://nextjs.org/docs/advanced-features/i18n)
- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [国际化路由配置](https://next-intl-docs.vercel.app/docs/routing)

---

修复完成！现在可以正常访问首页了。
