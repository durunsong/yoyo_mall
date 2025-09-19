# 路由和国际化问题修复

## 🐛 发现的问题

1. **产品页面404错误**: `/products` 路由返回404
2. **语言切换不生效**: 切换语言后页面内容没有改变

## 🔍 问题分析

### 1. 产品页面404错误

**根本原因**: 产品页面存在于 `src/app/(shop)/products/page.tsx`，但这个路径不在 `[locale]` 目录下，所以无法通过国际化路由访问。

**文件结构问题**:
```
src/app/
├── (shop)/
│   └── products/
│       └── page.tsx          # ❌ 不在国际化路由中
└── [locale]/
    ├── layout.tsx
    └── page.tsx               # ✅ 在国际化路由中
```

### 2. 语言切换问题

**根本原因**: 语言切换器的路径处理逻辑与 next-intl 的 `localePrefix: 'as-needed'` 配置不匹配。

**配置说明**:
- `localePrefix: 'as-needed'` 意味着默认语言（zh-CN）不显示前缀
- 其他语言（en-US, ja-JP, ko-KR）显示前缀

## 🔧 修复方案

### 1. 产品页面路由修复 ✅

#### 1.1 创建国际化产品页面

```bash
# 创建目录
New-Item -Path "src/app/[locale]/products" -ItemType Directory

# 移动并重构页面
src/app/[locale]/products/page.tsx
```

#### 1.2 添加国际化支持

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const t = useTranslations('products');
  const common = useTranslations('common');
  
  // 使用翻译
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      {/* ... */}
    </div>
  );
}
```

### 2. 语言切换修复 ✅

#### 2.1 更新语言切换逻辑

**修复前的问题**:
```tsx
// ❌ 简单的路径替换，不考虑 localePrefix 配置
if (languages.some(lang => lang.code === segments[1])) {
  segments[1] = newLocale;
} else {
  segments.splice(1, 0, newLocale);
}
```

**修复后的逻辑**:
```tsx
// ✅ 根据 localePrefix: 'as-needed' 配置处理
const handleLanguageChange = (newLocale: string) => {
  let newPath: string;
  
  if (newLocale === 'zh-CN') {
    // 切换到默认语言，移除所有语言前缀
    const segments = pathname.split('/');
    if (languages.some(lang => lang.code === segments[1])) {
      segments.splice(1, 1); // 移除语言前缀
    }
    newPath = segments.join('/') || '/';
  } else {
    // 切换到非默认语言，添加或替换语言前缀
    const segments = pathname.split('/');
    
    if (languages.some(lang => lang.code === segments[1])) {
      segments[1] = newLocale; // 替换现有前缀
    } else {
      segments.splice(1, 0, newLocale); // 添加新前缀
    }
    
    newPath = segments.join('/');
  }
  
  // 清理和标准化路径
  newPath = newPath.replace(/\/+/g, '/');
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  
  router.push(newPath);
  setIsOpen(false);
};
```

## 📋 修改的文件

### 1. 新创建的文件

- ✅ `src/app/[locale]/products/page.tsx` - 国际化产品页面

### 2. 修改的文件

- ✅ `src/components/ui/language-switcher.tsx` - 语言切换逻辑修复

### 3. 使用的翻译

产品页面使用了以下翻译键：

```json
// src/messages/zh-CN.json
{
  "products": {
    "title": "商品列表",
    "description": "浏览所有商品", 
    "searchPlaceholder": "搜索商品...",
    "totalProducts": "共 {count} 个商品",
    "categories": {
      "all": "全部",
      "mobile": "手机数码",
      "computer": "电脑办公",
      "appliances": "家用电器",
      "clothing": "服装配饰",
      "home": "家居生活"
    },
    "priceRange": "价格区间",
    "minPrice": "最低价",
    "maxPrice": "最高价", 
    "apply": "应用",
    "sortBy": {
      "default": "默认排序",
      "priceLowToHigh": "价格从低到高",
      "priceHighToLow": "价格从高到低",
      "ratingHighest": "评分最高",
      "newest": "最新上架"
    },
    "addToCart": "加入购物车",
    "outOfStock": "暂时缺货",
    "sale": "特价"
  }
}
```

## 🎯 修复结果

### ✅ 产品页面路由

- **修复前**: `GET /products 404 (Not Found)`
- **修复后**: 产品页面正常访问，支持所有语言

### ✅ 语言切换功能

- **修复前**: 切换语言后页面内容不变
- **修复后**: 切换语言后页面内容正确更新

### ✅ URL结构

不同语言的URL结构：

- **中文 (默认)**: `http://localhost:3000/products`
- **英文**: `http://localhost:3000/en-US/products`  
- **日文**: `http://localhost:3000/ja-JP/products`
- **韩文**: `http://localhost:3000/ko-KR/products`

## 🔍 技术要点

### 1. next-intl 路由配置

```tsx
// src/middleware.ts
export default createMiddleware({
  locales: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
  defaultLocale: 'zh-CN',
  localePrefix: 'as-needed', // 关键配置
});
```

### 2. 文件结构要求

所有需要国际化的页面必须放在 `[locale]` 目录下：

```
src/app/
├── [locale]/           # 国际化路由
│   ├── page.tsx       # 首页
│   ├── products/      # 产品页面
│   │   └── page.tsx
│   └── about/         # 其他页面
│       └── page.tsx
├── api/               # API 路由（不需要国际化）
└── admin/             # 管理页面（可选择是否国际化）
```

### 3. 客户端组件要求

使用 `useTranslations` 的页面必须是客户端组件：

```tsx
'use client';

import { useTranslations } from 'next-intl';
```

## 🚀 验证测试

### 1. 产品页面访问测试

- ✅ 访问 `/products` - 正常显示
- ✅ 访问 `/en-US/products` - 正常显示
- ✅ 访问 `/ja-JP/products` - 正常显示
- ✅ 访问 `/ko-KR/products` - 正常显示

### 2. 语言切换测试

1. **从首页切换语言**:
   - 中文 → 英文: `/` → `/en-US`
   - 英文 → 中文: `/en-US` → `/`

2. **从产品页切换语言**:
   - 中文 → 英文: `/products` → `/en-US/products`
   - 英文 → 中文: `/en-US/products` → `/products`

3. **页面内容更新**: 切换语言后，页面文本正确更新为对应语言

## 📚 学习要点

1. **next-intl 路由规则**: 理解 `localePrefix: 'as-needed'` 的行为
2. **文件结构重要性**: 国际化页面必须在正确的目录结构中
3. **客户端 vs 服务端**: 使用翻译钩子需要客户端组件
4. **路径处理**: 语言切换时的路径变换逻辑

---

修复完成！现在产品页面和语言切换功能都正常工作了。
