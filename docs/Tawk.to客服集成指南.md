# Tawk.to 在线客服集成指南

**日期**: 2025-10-29  
**版本**: v1.8.5

---

## 📋 功能概述

本项目已集成 [Tawk.to](https://www.tawk.to/) 在线客服系统,为用户提供实时在线支持。

### 特性

- ✅ 实时聊天功能
- ✅ 自动加载客服组件
- ✅ 支持多语言
- ✅ 移动端适配
- ✅ 离线消息
- ✅ 用户属性跟踪
- ✅ 聊天历史记录
- ✅ 文件发送支持

---

## 🚀 快速开始

### 1. 环境变量配置

在 `.env.local` 文件中配置你的 Tawk.to 凭据:

```env
# Tawk.to 客服配置
NEXT_PUBLIC_TAWK_WIDGET_ID=688c3386cabd5919319185d9
NEXT_PUBLIC_TAWK_API_KEY=1j1hqihb8
```

**获取方式:**
1. 访问 [Tawk.to Dashboard](https://dashboard.tawk.to/)
2. 登录你的账户
3. 进入 **Administration** > **Channels** > **Chat Widget**
4. 复制 **Widget ID** 和 **API Key**

### 2. 组件已自动集成

客服组件已在 `RootProviders` 中全局集成,无需额外配置即可使用。

```typescript
// src/components/providers/root-providers.tsx
<TawkToWidget />
```

### 3. 访问网站

启动项目后,客服图标会自动显示在页面右下角。

```bash
npm run dev
```

---

## 📖 使用方法

### 方式 1: 自动集成(默认)

客服组件会自动加载并显示在页面右下角,用户可以直接点击开始对话。

### 方式 2: 手动触发(可选)

如果你想在特定位置添加客服按钮,可以使用 `CustomerServiceButton` 组件:

```typescript
import { CustomerServiceButton } from '@/components/chat';

export default function MyPage() {
  return (
    <div>
      <h1>帮助中心</h1>
      {/* 客服按钮 */}
      <CustomerServiceButton 
        variant="default" 
        size="lg"
        showText={true}
      />
    </div>
  );
}
```

**Props 说明:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| className | string | - | 自定义样式类 |
| variant | 'default' \| 'outline' \| 'ghost' | 'default' | 按钮样式 |
| size | 'default' \| 'sm' \| 'lg' \| 'icon' | 'default' | 按钮大小 |
| showText | boolean | true | 是否显示文字 |

### 方式 3: 程序化控制

使用 `TawkToAPI` 可以通过代码控制客服组件:

```typescript
import { TawkToAPI } from '@/components/chat';

// 打开客服窗口
TawkToAPI.maximize();

// 最小化客服窗口
TawkToAPI.minimize();

// 切换客服窗口
TawkToAPI.toggle();

// 隐藏客服组件
TawkToAPI.hideWidget();

// 显示客服组件
TawkToAPI.showWidget();
```

---

## 🎨 高级功能

### 1. 设置用户属性

登录用户可以设置属性,便于客服识别:

```typescript
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { TawkToAPI } from '@/components/chat';

export function MyComponent() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      TawkToAPI.setAttributes({
        name: session.user.name,
        email: session.user.email,
        userId: session.user.id,
        // 自定义属性
        vipLevel: 'Gold',
        registrationDate: '2024-01-01',
      });
    }
  }, [session]);

  return <div>...</div>;
}
```

### 2. 添加用户标签

```typescript
// 为用户添加标签
TawkToAPI.addTags(['VIP', 'Premium', 'Chinese']);
```

### 3. 监听事件

```typescript
// 在 TawkToWidget 组件中已配置的事件:
window.Tawk_API.onLoad = function () {
  console.log('客服已加载');
};

window.Tawk_API.onChatMaximized = function () {
  console.log('客服窗口已打开');
};

window.Tawk_API.onChatMinimized = function () {
  console.log('客服窗口已最小化');
};
```

**可用事件:**
- `onLoad` - 客服加载完成
- `onChatMaximized` - 窗口打开
- `onChatMinimized` - 窗口最小化
- `onChatHidden` - 窗口隐藏
- `onChatStarted` - 开始对话
- `onChatEnded` - 对话结束
- `onPrechatSubmit` - 提交预聊天表单
- `onOfflineSubmit` - 提交离线消息

---

## 🌐 多语言支持

Tawk.to 自动检测用户浏览器语言,也可以在后台设置默认语言:

1. 登录 [Tawk.to Dashboard](https://dashboard.tawk.to/)
2. 进入 **Administration** > **Chat Widget**
3. 选择 **Appearance** 标签
4. 设置 **Language** 为所需语言

**支持的语言:**
- 中文(简体/繁体)
- 英语
- 日语
- 韩语
- 等等...

---

## 📱 移动端适配

Tawk.to 客服组件完全支持移动端:

- ✅ 响应式设计
- ✅ 触摸优化
- ✅ 全屏模式
- ✅ 推送通知(如果启用)

---

## 🎨 自定义样式

### 后台配置

在 Tawk.to Dashboard 中可以自定义:

1. **颜色方案**
   - 主题颜色
   - 按钮颜色
   - 头部颜色

2. **位置**
   - 左下角
   - 右下角(默认)
   - 左侧
   - 右侧

3. **行为**
   - 自动弹出时机
   - 欢迎消息
   - 离线消息

4. **外观**
   - 图标样式
   - 气泡样式
   - 字体设置

### 通过 CSS 自定义

可以通过全局 CSS 覆盖 Tawk.to 样式:

```css
/* globals.css */

/* 调整客服按钮位置 */
#tawkchat-minified-box {
  bottom: 80px !important;
  right: 20px !important;
}

/* 调整客服窗口大小 */
#tawkchat-container {
  max-width: 400px !important;
}
```

---

## 🔧 故障排查

### 问题 1: 客服组件不显示

**解决方案:**
1. 检查环境变量是否正确配置
2. 检查浏览器控制台是否有错误
3. 确认 Widget ID 和 API Key 是否正确
4. 检查网络连接

### 问题 2: 客服窗口被遮挡

**解决方案:**
```css
/* 提高 z-index */
#tawkchat-minified-box,
#tawkchat-container {
  z-index: 9999 !important;
}
```

### 问题 3: 用户属性未生效

**解决方案:**
- 确保在 Tawk_API 加载完成后调用 `setAttributes`
- 使用回调函数检查错误:
```typescript
TawkToAPI.setAttributes(attributes, (error) => {
  if (error) {
    console.error('设置用户属性失败:', error);
  }
});
```

### 问题 4: 开发环境脚本阻止

某些广告拦截器可能会阻止 Tawk.to 脚本:
- 临时禁用广告拦截器
- 将 `embed.tawk.to` 添加到白名单

---

## 📊 功能对比

| 功能 | 免费版 | 付费版 |
|------|--------|--------|
| 无限对话 | ✅ | ✅ |
| 多设备支持 | ✅ | ✅ |
| 移动应用 | ✅ | ✅ |
| 知识库 | ✅ | ✅ |
| 访客监控 | ✅ | ✅ |
| 聊天历史 | ✅ | ✅ |
| 文件传输 | ✅ | ✅ |
| 视频/语音通话 | ❌ | ✅ |
| 屏幕共享 | ❌ | ✅ |
| 去除品牌标识 | ❌ | ✅ |
| 高级分析 | ❌ | ✅ |

---

## 🔐 安全性

- ✅ **HTTPS 加密**: 所有通信通过 HTTPS 加密
- ✅ **GDPR 合规**: 符合欧盟数据保护法规
- ✅ **隐私保护**: 可配置数据保留策略
- ✅ **访问控制**: 支持 IP 白名单

---

## 📈 分析和报告

Tawk.to Dashboard 提供详细的分析报告:

- 对话统计
- 响应时间
- 客服评分
- 访客地理位置
- 流量来源
- 转化跟踪

---

## 🎯 最佳实践

### 1. 设置欢迎消息

在后台配置自动欢迎消息:
```
您好!欢迎来到 YOYO Mall,有什么可以帮您的吗?
```

### 2. 配置离线消息

当客服不在线时,自动显示留言表单。

### 3. 添加常见问题

在知识库中添加常见问题,减少重复询问。

### 4. 培训客服团队

- 快速响应(目标: 30秒内)
- 友好专业的沟通
- 了解产品和政策
- 使用预设回复

### 5. 监控和优化

定期查看分析报告,优化客服流程:
- 识别常见问题
- 优化响应时间
- 提升客户满意度

---

## 🔗 相关资源

- [Tawk.to 官网](https://www.tawk.to/)
- [Tawk.to 文档](https://help.tawk.to/)
- [JavaScript API 文档](https://developer.tawk.to/jsapi/)
- [Dashboard 登录](https://dashboard.tawk.to/)

---

## 📝 更新日志

### v1.8.5 (2025-10-29)
- ✅ 集成 Tawk.to 客服系统
- ✅ 支持自动加载和手动触发
- ✅ 添加用户属性跟踪
- ✅ 提供完整的 API 接口
- ✅ 创建客服按钮组件

---

## 💡 使用示例

### 示例 1: 在帮助页面添加客服按钮

```typescript
// src/app/help/page.tsx
import { CustomerServiceButton } from '@/components/chat';

export default function HelpPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">帮助中心</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 帮助卡片 */}
      </div>

      {/* 联系客服 */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          没有找到答案?
        </h2>
        <p className="text-gray-600 mb-6">
          我们的客服团队随时为您提供帮助
        </p>
        <CustomerServiceButton 
          variant="default" 
          size="lg"
        />
      </div>
    </div>
  );
}
```

### 示例 2: 在产品页面集成客服

```typescript
// src/app/products/[id]/page.tsx
import { TawkToAPI } from '@/components/chat';

export default function ProductPage() {
  const handleAskAboutProduct = () => {
    // 打开客服并预填充消息
    TawkToAPI.maximize();
    // 注意: 预填充消息需要在 Tawk.to 后台配置
  };

  return (
    <div>
      {/* 产品信息 */}
      
      <button 
        onClick={handleAskAboutProduct}
        className="mt-4"
      >
        咨询客服
      </button>
    </div>
  );
}
```

### 示例 3: 登录用户自动设置属性

```typescript
// src/components/chat/user-tracking.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TawkToAPI } from '@/components/chat';

export function UserTracking() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      // 设置用户属性
      TawkToAPI.setAttributes({
        name: session.user.name || 'Guest',
        email: session.user.email || '',
        userId: session.user.id,
        role: session.user.role,
      });

      // 添加标签
      const tags = ['Registered'];
      if (session.user.role === 'VIP') {
        tags.push('VIP');
      }
      TawkToAPI.addTags(tags);
    }
  }, [session]);

  return null;
}

// 在 RootProviders 中使用:
// <UserTracking />
```

---

**集成完成!** 🎉

如有问题,请参考 [Tawk.to 官方文档](https://help.tawk.to/) 或联系开发团队。



