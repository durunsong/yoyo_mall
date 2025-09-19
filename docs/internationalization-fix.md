# 国际化配置修复说明

## 🐛 问题描述

遇到了多个 `next-intl` 相关的错误：

1. **语言包位置错误**: 语言文件放在根目录的 `messages/` 而不是 `src/messages/`
2. **API 版本过时**: 使用了已弃用的 `locale` 参数
3. **异步参数未等待**: Next.js 15 要求 `params` 需要被 await
4. **配置路径错误**: `next.config.ts` 没有指定 i18n 配置文件路径

## 🔧 修复步骤

### 1. 移动语言包文件 ✅

**问题**: 语言包文件在根目录 `messages/` 下
**解决**: 移动到 `src/messages/` 下

```bash
mkdir -p src/messages
move messages/*.json src/messages/
rmdir messages
```

**新结构**:

```
src/
├── messages/
│   ├── zh-CN.json
│   ├── en-US.json
│   ├── ja-JP.json
│   └── ko-KR.json
└── ...
```

### 2. 更新 i18n 配置 ✅

**文件**: `src/i18n.ts`

**修复前** (使用已弃用的 API):

```tsx
export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();
  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**修复后** (使用新的 API):

```tsx
export default getRequestConfig(async ({ requestLocale }) => {
  // 等待并获取请求的语言
  let locale = await requestLocale;

  // 如果没有语言，使用默认语言
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale, // ✅ 返回 locale
    messages: (await import(`./messages/${locale}.json`)).default, // ✅ 正确路径
  };
});
```

### 3. 修复布局文件中的异步参数 ✅

**文件**: `src/app/[locale]/layout.tsx`

**修复前** (直接解构 params):

```tsx
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };              // ❌ 不是 Promise
}

export default async function LocaleLayout({
  children,
  params: { locale }                       // ❌ 直接解构
}: LocaleLayoutProps) {
```

**修复后** (等待 params):

```tsx
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;     // ✅ Promise 类型
}

export default async function LocaleLayout({
  children,
  params                                   // ✅ 不直接解构
}: LocaleLayoutProps) {
  // 等待 params
  const { locale } = await params;         // ✅ 先 await 再解构
```

### 4. 更新 Next.js 配置 ✅

**文件**: `next.config.ts`

**修复前** (没有指定配置路径):

```tsx
const withNextIntl = createNextIntlPlugin();
```

**修复后** (指定配置文件路径):

```tsx
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
```

## 🎯 修复结果

### 解决的错误

1. ✅ **`locale` parameter is deprecated** → 使用 `requestLocale`
2. ✅ **`params` should be awaited** → 添加 `await params`
3. ✅ **A `locale` is expected to be returned** → 在配置中返回 locale
4. ✅ **Module path error** → 更正语言文件路径
5. ✅ **Configuration path** → 指定 i18n 配置文件路径

### 现在支持的功能

- 🌐 **多语言路由**:
  - `/` → 中文 (默认)
  - `/en-US/` → 英文
  - `/ja-JP/` → 日文
  - `/ko-KR/` → 韩文

- 🔧 **自动语言检测**: 根据浏览器语言自动选择
- 📱 **响应式国际化**: 所有组件支持多语言
- 🎨 **保持现有功能**: 登录弹窗、样式等不受影响

### 文件结构

```
yoyo_mall/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 根布局
│   │   └── [locale]/                  # 国际化路由
│   │       ├── layout.tsx             # 国际化布局
│   │       ├── page.tsx               # 首页
│   │       └── ...
│   ├── messages/                      # 语言包 (新位置)
│   │   ├── zh-CN.json
│   │   ├── en-US.json
│   │   ├── ja-JP.json
│   │   └── ko-KR.json
│   ├── i18n.ts                        # 国际化配置
│   └── middleware.ts                  # 路由中间件
├── next.config.ts                     # Next.js 配置
└── ...
```

## 🚀 测试验证

现在可以访问：

- ✅ `http://localhost:3000/` (中文)
- ✅ `http://localhost:3000/en-US/` (英文)
- ✅ 所有原有功能正常工作

## 📚 相关文档

- [next-intl v3.22 更新说明](https://next-intl.dev/blog/next-intl-3-22)
- [Next.js 15 异步 API](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [国际化最佳实践](https://next-intl.dev/docs/routing)

---

修复完成！现在国际化功能应该正常工作了。
