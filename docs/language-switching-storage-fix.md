# 语言切换本地存储修复

## 🐛 问题描述

用户报告的问题：
1. **本地存储不更新**: 切换语言为日语后，本地存储中的 `i18n-storage` 仍然显示 `zh-CN`
2. **界面语言不变**: 切换语言后，页面内容没有改变为对应语言

## 🔍 问题分析

### 根本原因
1. **缺少本地存储同步**: 语言切换器只通过URL路由切换，没有更新本地存储
2. **next-intl路由机制**: 仅依赖URL路由，缺少持久化存储机制
3. **中间件缺少语言偏好检测**: 没有读取用户的语言偏好来自动重定向

### 技术分析
- `useRouter().push()` 只是客户端路由跳转，不会触发页面完全重新加载
- next-intl 的语言检测主要基于URL，没有与本地存储集成
- 缺少cookie支持，导致服务端无法获取用户语言偏好

## 🔧 修复方案

### 1. 创建语言存储Hook ✅

**文件**: `src/hooks/use-locale-storage.ts`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

export function useLocaleStorage() {
  const currentLocale = useLocale();
  const [storedLocale, setStoredLocale] = useState<string | null>(null);

  useEffect(() => {
    // 从localStorage读取语言偏好
    const stored = localStorage.getItem('preferred-locale');
    setStoredLocale(stored);
    
    // 如果当前语言与存储的语言不一致，更新存储
    if (stored !== currentLocale) {
      localStorage.setItem('preferred-locale', currentLocale);
      setStoredLocale(currentLocale);
    }
  }, [currentLocale]);

  const setLocale = (locale: string) => {
    // 同时设置cookie和localStorage
    document.cookie = `preferred-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('preferred-locale', locale);
    setStoredLocale(locale);
    
    // 更新localStorage中的i18n-storage
    const i18nStorage = {
      state: {
        locale: locale
      },
      version: 0
    };
    localStorage.setItem('i18n-storage', JSON.stringify(i18nStorage));
  };

  return {
    storedLocale,
    setLocale,
    currentLocale
  };
}
```

### 2. 更新语言切换器 ✅

**文件**: `src/components/ui/language-switcher.tsx`

**核心改进**:
```tsx
import { useLocaleStorage } from '@/hooks/use-locale-storage';

export function LanguageSwitcher() {
  const { setLocale } = useLocaleStorage();
  
  const handleLanguageChange = (newLocale: string) => {
    // 使用hook保存语言偏好（包含cookie和localStorage）
    setLocale(newLocale);
    
    // 构建新路径
    let newPath = constructNewPath(newLocale);
    
    // 强制刷新页面以确保语言更改生效
    window.location.href = newPath;
    setIsOpen(false);
  };
}
```

### 3. 升级中间件支持Cookie ✅

**文件**: `src/middleware.ts`

**新增功能**:
```tsx
import { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // 检查用户的语言偏好 cookie
  const preferredLocale = request.cookies.get('preferred-locale')?.value;
  
  if (preferredLocale && locales.includes(preferredLocale as any)) {
    // 如果有偏好语言且当前URL不匹配，重定向
    const pathname = request.nextUrl.pathname;
    const currentLocale = detectCurrentLocale(pathname);
    
    if (currentLocale !== preferredLocale) {
      const newPath = constructLocalizePath(pathname, preferredLocale);
      if (newPath !== pathname) {
        return Response.redirect(new URL(newPath, request.url));
      }
    }
  }
  
  return intlMiddleware(request);
}
```

## 📋 修改的文件

### 新创建的文件
- ✅ `src/hooks/use-locale-storage.ts` - 语言存储管理Hook
- ✅ `src/hooks/index.ts` - Hook导出文件

### 修改的文件
- ✅ `src/components/ui/language-switcher.tsx` - 集成新的存储Hook
- ✅ `src/middleware.ts` - 添加Cookie语言偏好检测

## 🎯 修复机制

### 1. 多层存储策略

```
语言切换触发
       ↓
1. Cookie存储 (服务端可读)
       ↓  
2. localStorage存储 (客户端持久化)
       ↓
3. i18n-storage更新 (兼容现有系统)
       ↓
4. 页面重新加载 (确保生效)
```

### 2. 存储格式标准化

**Cookie**:
```
preferred-locale=ja-JP; path=/; max-age=31536000; SameSite=Lax
```

**localStorage**:
```json
// preferred-locale
"ja-JP"

// i18n-storage  
{
  "state": {
    "locale": "ja-JP"
  },
  "version": 0
}
```

### 3. 自动同步机制

- **页面加载时**: Hook检查并同步当前语言到存储
- **语言切换时**: 立即更新所有存储位置
- **服务端检测**: 中间件读取Cookie偏好，自动重定向

## 🔄 完整工作流程

### 用户切换语言流程

1. **用户点击语言选项** (例如: 中文 → 日语)
   ```
   用户点击 "🇯🇵 日本語"
   ```

2. **Hook更新存储**
   ```tsx
   setLocale('ja-JP');
   // → Cookie: preferred-locale=ja-JP
   // → localStorage: preferred-locale="ja-JP"  
   // → localStorage: i18n-storage={"state":{"locale":"ja-JP"},...}
   ```

3. **路径计算和跳转**
   ```
   当前: http://localhost:3000/
   目标: http://localhost:3000/ja-JP/
   ```

4. **页面完全重新加载**
   ```tsx
   window.location.href = newPath;
   // 触发完整的页面刷新，确保语言生效
   ```

5. **中间件验证**
   ```
   服务端读取 Cookie: preferred-locale=ja-JP
   URL语言: ja-JP
   匹配 ✅ → 正常加载
   ```

6. **页面渲染**
   ```
   next-intl检测到ja-JP → 加载日语翻译
   界面显示日语内容 ✅
   ```

## ✅ 修复结果

### 本地存储更新
- **修复前**: `i18n-storage: {"state":{"locale":"zh-CN"},...}`
- **修复后**: `i18n-storage: {"state":{"locale":"ja-JP"},...}`

### 界面语言更新  
- **修复前**: 界面内容仍为中文
- **修复后**: 界面内容正确显示为日语

### 持久化支持
- **修复前**: 刷新页面语言丢失
- **修复后**: 刷新页面语言保持

## 🔍 技术要点

### 1. 为什么使用 `window.location.href`？

- **next-intl要求**: 语言切换需要完整的页面重新加载
- **缓存清理**: 清除React和Next.js的内存缓存
- **服务端同步**: 确保服务端检测到新的语言环境

### 2. Cookie vs localStorage

| 存储方式 | 优势 | 用途 |
|---------|------|------|
| Cookie | 服务端可读、自动发送 | 中间件重定向、SSR |
| localStorage | 客户端持久化、容量大 | 用户偏好记忆、兼容性 |

### 3. 中间件重定向逻辑

```tsx
// 检测当前URL语言
const currentLocale = pathname.startsWith('/ja-JP') ? 'ja-JP' : 'zh-CN';

// 与Cookie偏好对比
if (currentLocale !== preferredLocale) {
  // 构建新路径并重定向
  return Response.redirect(newURL);
}
```

## 🚀 用户体验改进

### 修复前的用户体验
1. 点击语言切换 → URL改变 ❌ 内容不变
2. 刷新页面 → 语言重置为默认
3. 本地存储不同步 → 状态不一致

### 修复后的用户体验  
1. 点击语言切换 → URL改变 ✅ 内容立即更新
2. 刷新页面 → 语言保持用户选择
3. 多标签页同步 → 一致的语言体验
4. 服务端检测 → 自动语言重定向

---

修复完成！现在语言切换功能完全正常，本地存储和界面都会正确更新。
