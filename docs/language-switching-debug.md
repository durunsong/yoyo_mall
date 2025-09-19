# 语言切换功能调试修复

## 🐛 问题报告

用户反馈：**"header上面切换语言功能还是不行"**

## 🔍 问题调查

### 1. 检查现有实现

检查发现问题所在：

1. **LanguageSwitcher组件**: 已经实现了完整的语言切换逻辑
2. **AntdHeader组件**: 语言切换处理函数是空的（只有TODO注释）
3. **中间件过于复杂**: 可能导致冲突

### 2. 根本原因

```typescript
// src/components/layout/antd-header.tsx
const handleLanguageChange: MenuProps['onClick'] = ({ key }) => {
  console.log('切换语言:', key);
  // TODO: 实现语言切换逻辑  ❌ 空实现！
};
```

**关键问题**: Header中的语言切换器没有实际的切换逻辑！

## 🔧 修复方案

### 1. 简化中间件 ✅

**修复前** (复杂的自定义逻辑):
```typescript
export default function middleware(request: NextRequest) {
  const preferredLocale = request.cookies.get('preferred-locale')?.value;
  // 复杂的重定向逻辑...
  return intlMiddleware(request);
}
```

**修复后** (使用标准next-intl中间件):
```typescript
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  alternateLinks: true,
  localeDetection: true,
});
```

### 2. 修复Header语言切换 ✅

**添加依赖**:
```typescript
import { useLocaleStorage } from '@/hooks/use-locale-storage';

export function AntdHeader() {
  const { setLocale } = useLocaleStorage();
  // ...
}
```

**实现切换逻辑**:
```typescript
const handleLanguageChange: MenuProps['onClick'] = ({ key }) => {
  const newLocale = key as string;
  console.log('切换语言:', newLocale);
  
  // 1. 保存语言偏好
  setLocale(newLocale);
  
  // 2. 构建新URL
  const currentPathname = pathname;
  let newPath: string;
  
  // 3. 解析当前路径
  const pathSegments = currentPathname.split('/').filter(Boolean);
  const currentLocaleFromPath = pathSegments[0];
  const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
  const isCurrentPathHasLocale = locales.includes(currentLocaleFromPath);
  
  // 4. 构建新路径
  if (newLocale === 'zh-CN') {
    // 默认语言：移除前缀
    newPath = isCurrentPathHasLocale 
      ? '/' + pathSegments.slice(1).join('/')
      : currentPathname;
  } else {
    // 非默认语言：添加/替换前缀
    if (isCurrentPathHasLocale) {
      pathSegments[0] = newLocale;
      newPath = '/' + pathSegments.join('/');
    } else {
      newPath = `/${newLocale}${currentPathname === '/' ? '' : currentPathname}`;
    }
  }
  
  // 5. 清理并跳转
  newPath = newPath.replace(/\/+/g, '/');
  if (newPath === '') newPath = '/';
  
  console.log(`路径切换: ${currentPathname} → ${newPath}`);
  window.location.href = newPath;
};
```

### 3. 添加调试信息 ✅

为了便于调试，添加了详细的控制台输出：

```typescript
console.log('切换语言:', newLocale);
console.log(`路径切换: ${currentPathname} → ${newPath}`);
```

## 📋 修改的文件

### 更新的文件
- ✅ `src/middleware.ts` - 简化为标准next-intl中间件
- ✅ `src/components/layout/antd-header.tsx` - 实现语言切换逻辑

### 保持的文件
- ✅ `src/components/ui/language-switcher.tsx` - 独立的语言切换器组件
- ✅ `src/hooks/use-locale-storage.ts` - 语言存储Hook

## 🔄 工作流程验证

### 预期的语言切换流程

1. **用户点击语言选项** (例如: 中文 → 日语)
   ```
   Header中的Dropdown点击 "🇯🇵 日本語"
   ```

2. **触发handleLanguageChange**
   ```typescript
   handleLanguageChange({ key: 'ja-JP' })
   ```

3. **保存语言偏好**
   ```typescript
   setLocale('ja-JP');
   // → Cookie: preferred-locale=ja-JP
   // → localStorage: preferred-locale="ja-JP"
   // → localStorage: i18n-storage={"state":{"locale":"ja-JP"},...}
   ```

4. **路径计算**
   ```
   当前: /                    → 目标: /ja-JP/
   当前: /products           → 目标: /ja-JP/products
   当前: /en-US/products     → 目标: /ja-JP/products
   当前: /ja-JP/products     → 目标: /ja-JP/products (无变化)
   ```

5. **页面跳转**
   ```typescript
   window.location.href = newPath;
   // 完整的页面重新加载，确保语言生效
   ```

6. **验证结果**
   ```
   - URL正确更新
   - 页面内容显示为日语
   - localStorage正确更新
   - 语言状态持久化
   ```

## 🎯 测试验证

### 测试用例

1. **从首页切换语言**
   - 中文首页 `/` → 日语首页 `/ja-JP/`
   - 日语首页 `/ja-JP/` → 中文首页 `/`

2. **从产品页切换语言**
   - 中文产品页 `/products` → 日语产品页 `/ja-JP/products`
   - 日语产品页 `/ja-JP/products` → 中文产品页 `/products`

3. **语言间相互切换**
   - 中文 → 英文 → 日语 → 韩语 → 中文

4. **刷新页面验证**
   - 切换到日语后刷新页面，应该保持日语

### 调试输出

打开浏览器开发者工具Console，语言切换时应该看到：

```
切换语言: ja-JP
路径切换: / → /ja-JP/
```

## ⚠️ 注意事项

### 1. 浏览器刷新
使用 `window.location.href` 而不是 `router.push()` 是有意的：
- 确保完整的页面重新加载
- 清除React组件状态缓存
- 让next-intl重新初始化语言环境

### 2. 路径处理
考虑了所有可能的路径情况：
- 根路径 `/`
- 带页面的路径 `/products`
- 带语言前缀的路径 `/ja-JP/products`

### 3. 默认语言特殊处理
中文作为默认语言不显示前缀，符合 `localePrefix: 'as-needed'` 配置

## 🚀 用户体验改进

### 修复前
- 点击语言切换器 → 无反应
- 只有控制台输出，没有实际切换

### 修复后
- 点击语言切换器 → 立即跳转并切换语言
- 页面内容实时更新为选择的语言
- 语言偏好持久化保存
- 刷新页面语言保持不变

---

现在语言切换功能应该完全正常工作了！请测试Header中的语言下拉菜单。
