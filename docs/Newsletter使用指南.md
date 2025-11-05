# Newsletter（邮件订阅）功能使用指南

## 目录
- [功能概述](#功能概述)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [功能使用](#功能使用)
- [API 文档](#api-文档)
- [常见问题](#常见问题)

---

## 功能概述

Newsletter 功能允许用户订阅网站的邮件通讯，接收最新的优惠信息和产品资讯。

### 主要特性

✅ **双重确认订阅** - 发送验证邮件，防止垃圾订阅  
✅ **优雅的邮件模板** - 精美的 HTML 邮件模板  
✅ **一键取消订阅** - 每封邮件都包含取消订阅链接  
✅ **管理后台** - 查看和导出订阅者列表  
✅ **状态管理** - 待验证、已激活、已取消、退回  
✅ **来源追踪** - 记录订阅来源（footer、popup等）  
✅ **Resend 集成** - 使用 Resend 邮件服务，高送达率  

---

## 技术架构

### 技术栈

- **邮件服务**: [Resend](https://resend.com/) - 现代化的邮件 API
- **数据库**: PostgreSQL (通过 Prisma ORM)
- **前端**: Next.js 15 + React
- **样式**: Tailwind CSS

### 数据库模型

```prisma
model NewsletterSubscriber {
  id              String              @id @default(cuid())
  email           String              @unique
  status          SubscriberStatus    @default(PENDING)
  subscribedAt    DateTime            @default(now())
  confirmedAt     DateTime?
  unsubscribedAt  DateTime?
  verifyToken     String?             @unique
  unsubscribeToken String?            @unique
  source          String?
  metadata        Json?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}

enum SubscriberStatus {
  PENDING       // 待验证
  ACTIVE        // 已激活
  UNSUBSCRIBED  // 已取消订阅
  BOUNCED       // 邮件退回
}
```

### 文件结构

```
src/
├── app/
│   ├── api/
│   │   ├── newsletter/
│   │   │   ├── subscribe/route.ts      # 订阅 API
│   │   │   ├── verify/route.ts         # 验证 API
│   │   │   └── unsubscribe/route.ts    # 取消订阅 API
│   │   └── admin/
│   │       └── newsletter/
│   │           ├── subscribers/route.ts # 获取订阅者列表
│   │           └── export/route.ts      # 导出订阅者
│   ├── admin/
│   │   └── newsletter/page.tsx         # 管理后台页面
│   └── newsletter/
│       ├── verify-success/page.tsx     # 验证成功页面
│       ├── verify-error/page.tsx       # 验证失败页面
│       └── unsubscribe-success/page.tsx # 取消订阅成功页面
├── components/
│   └── layout/
│       └── footer.tsx                   # Footer 组件（包含订阅表单）
└── lib/
    ├── resend.ts                        # Resend 配置
    └── email-templates.ts               # 邮件模板
```

---

## 快速开始

### 1. 注册 Resend 账号

1. 访问 [Resend.com](https://resend.com/)
2. 注册免费账号（免费额度：100 封邮件/天）
3. 验证你的域名（或使用 Resend 提供的测试域名）
4. 获取 API Key

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# Resend API Key（必需）
RESEND_API_KEY=re_xxxxxxxxxxxxx

# 发件人邮箱（必需）
RESEND_FROM_EMAIL="YOYO Mall <noreply@your-domain.com>"

# 应用 URL（必需，用于生成验证链接）
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**重要说明:**
- `RESEND_API_KEY`: 从 Resend Dashboard 获取
- `RESEND_FROM_EMAIL`: 必须使用已验证的域名邮箱
- `NEXT_PUBLIC_APP_URL`: 生产环境必须配置，用于生成邮件中的验证链接

### 3. 运行数据库迁移

```bash
pnpm prisma migrate dev
```

### 4. 测试功能

1. 启动开发服务器: `pnpm dev`
2. 访问首页，滚动到底部 Footer
3. 输入邮箱，点击"订阅"
4. 查收邮件，点击验证链接
5. 访问管理后台查看订阅者: `/admin/newsletter`

---

## 配置说明

### Resend 域名验证

#### 方式一：使用自己的域名（推荐用于生产环境）

1. 在 Resend Dashboard 中添加你的域名
2. 添加 DNS 记录（SPF, DKIM, DMARC）
3. 等待验证通过（通常几分钟）
4. 使用 `noreply@your-domain.com` 作为发件人

#### 方式二：使用 Resend 测试域名（适合开发测试）

Resend 提供 `onboarding@resend.dev` 测试域名，无需验证即可使用，但有以下限制：
- 只能发送到你在 Resend 注册的邮箱
- 每天限额 100 封
- 邮件可能被标记为垃圾邮件

### 邮件模板自定义

编辑 `src/lib/email-templates.ts` 来自定义邮件模板：

```typescript
export function WelcomeEmailTemplate({
  verifyUrl,
  unsubscribeUrl,
  companyName = 'YOYO Mall',
  logoUrl,
}: EmailTemplateProps) {
  // 自定义你的HTML邮件模板
  return `...`;
}
```

**提示:** 
- 使用内联 CSS 样式确保兼容性
- 测试多个邮件客户端（Gmail、Outlook等）
- 保持简洁，避免过度设计

---

## 功能使用

### 前台用户订阅流程

1. **填写邮箱**
   - 用户在 Footer 输入邮箱地址
   - 点击"订阅"按钮

2. **接收验证邮件**
   - 系统发送欢迎邮件
   - 包含验证链接

3. **点击验证**
   - 用户点击邮件中的验证链接
   - 跳转到验证成功页面
   - 接收确认邮件

4. **接收资讯**
   - 用户状态变为"已激活"
   - 可以接收营销邮件

### 后台管理功能

访问 `/admin/newsletter` 查看管理面板。

#### 1. 查看订阅者列表

- 显示所有订阅者信息
- 支持按状态筛选（全部、已激活、待验证、已取消）
- 支持邮箱搜索

#### 2. 导出订阅者

- 点击"导出 CSV"按钮
- 下载包含所有激活订阅者的 CSV 文件
- 可用于邮件营销工具

#### 3. 统计信息

管理面板顶部显示：
- 总订阅数
- 已激活数量
- 待验证数量
- 已取消数量

---

## API 文档

### 前台 API

#### 1. 订阅 Newsletter

**端点:** `POST /api/newsletter/subscribe`

**请求体:**
```json
{
  "email": "user@example.com",
  "source": "footer"  // 可选
}
```

**响应:**
```json
{
  "success": true,
  "message": "订阅成功！请查收验证邮件以完成订阅"
}
```

#### 2. 验证邮箱

**端点:** `GET /api/newsletter/verify?token={token}`

**参数:**
- `token`: 验证令牌（从邮件链接获取）

**响应:** 重定向到成功或失败页面

#### 3. 取消订阅

**端点:** `GET /api/newsletter/unsubscribe?token={token}`

**参数:**
- `token`: 取消订阅令牌（从邮件链接获取）

**响应:** 重定向到成功页面

### 管理后台 API

#### 1. 获取订阅者列表

**端点:** `GET /api/admin/newsletter/subscribers`

**权限:** 需要管理员权限

**响应:**
```json
{
  "success": true,
  "data": {
    "subscribers": [...],
    "stats": {
      "total": 100,
      "active": 80,
      "pending": 15,
      "unsubscribed": 5
    }
  }
}
```

#### 2. 导出订阅者

**端点:** `GET /api/admin/newsletter/export`

**权限:** 需要管理员权限

**响应:** CSV 文件下载

---

## 常见问题

### 1. 邮件发送失败

**问题:** 订阅后没有收到验证邮件

**解决方案:**
- 检查 `RESEND_API_KEY` 是否正确配置
- 检查发件人邮箱域名是否已验证
- 查看服务器日志确认错误信息
- 检查垃圾邮件文件夹
- 确认 Resend 账户没有超出限额

### 2. 验证链接无效

**问题:** 点击验证链接显示"无效令牌"

**解决方案:**
- 检查 `NEXT_PUBLIC_APP_URL` 是否正确配置
- 确认数据库中的 `verifyToken` 没有被清除
- 检查链接是否完整（可能被邮件客户端截断）

### 3. 管理后台无法访问

**问题:** 访问 `/admin/newsletter` 显示 403 错误

**解决方案:**
- 确认已使用管理员账号登录
- 检查用户的 `role` 字段是否为 `ADMIN`
- 查看浏览器控制台和服务器日志

### 4. 邮件进入垃圾箱

**问题:** 发送的邮件被标记为垃圾邮件

**解决方案:**
- 完成域名验证（SPF、DKIM、DMARC）
- 避免使用垃圾邮件常用词汇
- 保持发件人域名信誉良好
- 使用 Resend 的域名验证功能

### 5. 如何批量发送营销邮件？

**回答:** 营销活动功能正在开发中。目前可以：

1. 导出已激活订阅者列表（CSV）
2. 使用第三方邮件营销工具（如 Mailchimp）
3. 或者等待后续更新，我们将添加内置的批量发送功能

---

## 最佳实践

### 1. 邮件内容

✅ **要做:**
- 提供有价值的内容
- 定期发送（每周或每月）
- 包含清晰的取消订阅链接
- 使用响应式设计
- 测试多种设备和邮件客户端

❌ **不要做:**
- 发送垃圾内容
- 过于频繁发送
- 隐藏取消订阅选项
- 购买邮件列表
- 向未订阅用户发送邮件

### 2. 数据管理

- 定期导出备份订阅者数据
- 清理无效邮箱（退回的邮件）
- 尊重用户隐私
- 遵守 GDPR 等数据保护法规

### 3. 性能优化

- Resend 自动处理发送队列
- 避免短时间大量发送
- 监控发送成功率
- 及时处理退回邮件

---

## 升级和扩展

### 已实现功能

- ✅ 邮箱订阅和验证
- ✅ 取消订阅
- ✅ 订阅者管理
- ✅ 导出 CSV
- ✅ 统计信息

### 计划中功能

- ⏳ 批量营销邮件发送
- ⏳ 邮件模板编辑器
- ⏳ 发送历史记录
- ⏳ 邮件打开和点击追踪
- ⏳ A/B 测试
- ⏳ 自动化营销流程

---

## 技术支持

### 相关链接

- [Resend 文档](https://resend.com/docs)
- [Resend API 参考](https://resend.com/docs/api-reference)
- [Prisma 文档](https://www.prisma.io/docs)

### 获取帮助

如果遇到问题：

1. 查看服务器日志
2. 检查 Resend Dashboard 的发送记录
3. 查阅本文档的常见问题部分
4. 联系技术支持团队

---

## 更新日志

### v1.0.0 (2025-01-05)

- ✨ 初始版本发布
- ✅ 集成 Resend 邮件服务
- ✅ 实现订阅和验证流程
- ✅ 添加管理后台
- ✅ 支持 CSV 导出

---

**祝您使用愉快！** 🎉

