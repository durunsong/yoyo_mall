# Resend 配置指南

## Resend 简介

[Resend](https://resend.com/) 是一个现代化的邮件发送服务，专为开发者设计，与 Next.js 完美集成。

### 为什么选择 Resend？

✅ **开发者友好** - 简单的 API，完美的 TypeScript 支持  
✅ **高送达率** - 99.9% 的邮件送达率  
✅ **慷慨的免费额度** - 100 封邮件/天，3000 封邮件/月  
✅ **快速集成** - 几分钟即可完成配置  
✅ **React 邮件支持** - 使用 React 组件编写邮件模板  
✅ **实时分析** - 查看发送状态、打开率等统计  

---

## 注册和配置

### 步骤 1: 注册账号

1. 访问 [resend.com](https://resend.com/)
2. 点击 "Get Started" 或 "Sign Up"
3. 使用 GitHub 账号登录（推荐）或邮箱注册
4. 免费账号即可开始使用

### 步骤 2: 获取 API Key

1. 登录 Resend Dashboard
2. 点击左侧菜单的 "API Keys"
3. 点击 "Create API Key"
4. 输入名称（如 "YOYO Mall Production"）
5. 选择权限：
   - **Sending access** - 发送邮件权限（必需）
   - **Full access** - 完全访问权限（可选）
6. 点击 "Create"
7. 复制生成的 API Key（只显示一次，请妥善保管）

**API Key 格式:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

### 步骤 3: 验证域名（重要）

#### 为什么需要验证域名？

- 提高邮件送达率
- 避免进入垃圾邮件箱
- 使用自己的域名发送邮件（如 `noreply@yourdomain.com`）
- 建立品牌信任度

#### 验证步骤

1. **添加域名**
   - 在 Resend Dashboard 点击 "Domains"
   - 点击 "Add Domain"
   - 输入你的域名（如 `yourdomain.com`）

2. **配置 DNS 记录**

   Resend 会提供以下 DNS 记录，需要添加到你的域名 DNS 设置中：

   **SPF 记录 (TXT)**
   ```
   类型: TXT
   主机: @
   值: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM 记录 (TXT)**
   ```
   类型: TXT
   主机: resend._domainkey
   值: [Resend 提供的长字符串]
   ```

   **DMARC 记录 (TXT)** （可选但推荐）
   ```
   类型: TXT
   主机: _dmarc
   值: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

3. **等待验证**
   - DNS 记录传播需要 5 分钟到 48 小时
   - 通常在 10-30 分钟内完成
   - Resend 会显示验证状态

4. **测试发送**
   - 验证完成后，测试发送一封邮件
   - 检查是否成功送达

#### 使用测试域名（仅限开发）

如果暂时无法验证域名，可以使用 Resend 提供的测试域名：

```
发件人: onboarding@resend.dev
```

**限制:**
- 只能发送到你在 Resend 注册的邮箱
- 每天 100 封限额
- 可能被标记为垃圾邮件

---

## 环境变量配置

### 开发环境 (.env.local)

```bash
# Resend API Key（必需）
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 发件人邮箱（必需）
# 使用已验证的域名邮箱
RESEND_FROM_EMAIL="YOYO Mall <noreply@yourdomain.com>"

# 或使用测试域名（仅开发环境）
# RESEND_FROM_EMAIL="YOYO Mall <onboarding@resend.dev>"

# 应用 URL（必需）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 生产环境 (Vercel)

在 Vercel Dashboard 中配置：

1. 进入项目设置 → Environment Variables
2. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| RESEND_API_KEY | `re_xxx...` | Production |
| RESEND_FROM_EMAIL | `YOYO Mall <noreply@yourdomain.com>` | Production |
| NEXT_PUBLIC_APP_URL | `https://yourdomain.com` | Production |

3. 保存并重新部署

---

## DNS 配置详解

### 常见 DNS 提供商配置

#### Cloudflare

1. 登录 Cloudflare Dashboard
2. 选择你的域名
3. 进入 DNS 管理
4. 点击 "Add record"
5. 按照 Resend 提供的记录添加

**示例:**
```
类型: TXT
名称: @
内容: v=spf1 include:_spf.resend.com ~all
TTL: Auto
代理状态: 仅 DNS
```

#### Namecheap

1. 登录 Namecheap
2. 选择域名 → Advanced DNS
3. 添加新记录
4. 按照 Resend 提供的记录配置

#### 阿里云

1. 登录阿里云控制台
2. 进入域名管理
3. 点击"解析设置"
4. 添加记录

#### 其他提供商

大多数 DNS 提供商的配置流程类似，参考上述步骤即可。

### 验证 DNS 配置

使用命令行工具检查 DNS 记录是否生效：

```bash
# 检查 SPF 记录
nslookup -type=TXT yourdomain.com

# 检查 DKIM 记录
nslookup -type=TXT resend._domainkey.yourdomain.com

# 检查 DMARC 记录
nslookup -type=TXT _dmarc.yourdomain.com
```

或使用在线工具：
- [MXToolbox](https://mxtoolbox.com/)
- [DNSChecker](https://dnschecker.org/)

---

## 测试邮件发送

### 使用 Resend Dashboard 测试

1. 进入 Resend Dashboard
2. 点击左侧的 "Emails"
3. 点击 "Send Test Email"
4. 填写收件人邮箱
5. 发送测试邮件

### 使用代码测试

创建一个测试脚本 `test-email.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: 'YOYO Mall <noreply@yourdomain.com>',
      to: 'your-email@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email from YOYO Mall!</p>',
    });

    console.log('邮件发送成功:', result);
  } catch (error) {
    console.error('邮件发送失败:', error);
  }
}

testEmail();
```

运行测试：
```bash
npx tsx test-email.ts
```

---

## 价格和限制

### 免费计划

- **100 封邮件/天**
- **3,000 封邮件/月**
- 1 个域名
- 基础功能
- 社区支持

**适合:** 个人项目、小型网站、开发测试

### Pro 计划 ($20/月)

- **50,000 封邮件/月**
- 额外邮件 $1/1000 封
- 3 个域名
- 所有功能
- 邮件支持

**适合:** 中小型企业、SaaS 应用

### Enterprise 计划 (定制)

- 无限邮件
- 无限域名
- 专属支持
- SLA 保证

**适合:** 大型企业

### 额外费用

- 额外域名: $5/域名/月
- 额外 API Key: 免费

---

## 最佳实践

### 1. 安全性

✅ **保护 API Key**
- 不要提交到代码仓库
- 使用环境变量
- 定期轮换 API Key
- 为不同环境使用不同的 Key

✅ **限制权限**
- 只给必要的权限
- 生产环境使用受限 Key

### 2. 发送策略

✅ **避免被标记为垃圾邮件**
- 完成域名验证
- 使用真实的发件人信息
- 提供取消订阅链接
- 避免垃圾邮件关键词
- 保持发送频率稳定

✅ **提高送达率**
- 定期清理无效邮箱
- 处理退回邮件
- 监控投诉率
- 使用认证域名

### 3. 监控和分析

✅ **使用 Resend Dashboard**
- 查看发送历史
- 监控送达率
- 分析打开率
- 追踪点击率

✅ **设置 Webhook**
- 接收实时事件通知
- 处理退回邮件
- 记录投诉

---

## 故障排查

### 常见错误

#### 1. "Invalid API Key"

**原因:** API Key 不正确或已失效

**解决:**
- 检查环境变量是否正确配置
- 确认 API Key 格式正确（re_xxx）
- 重新生成 API Key

#### 2. "Domain not verified"

**原因:** 域名未验证或验证失败

**解决:**
- 检查 DNS 记录是否正确添加
- 等待 DNS 传播（最多 48 小时）
- 使用测试域名 `onboarding@resend.dev`

#### 3. "Daily sending quota exceeded"

**原因:** 超出每日发送限额

**解决:**
- 等待第二天重置
- 升级到 Pro 计划
- 优化发送频率

#### 4. "Recipient not found"

**原因:** 使用测试域名发送到未注册的邮箱

**解决:**
- 验证自己的域名
- 或只发送到注册邮箱

---

## 迁移指南

### 从 Nodemailer 迁移

**之前 (Nodemailer):**
```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

await transporter.sendMail({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hello World</p>',
});
```

**现在 (Resend):**
```typescript
import { resend } from '@/lib/resend';

await resend.emails.send({
  from: 'YOYO Mall <noreply@yourdomain.com>',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hello World</p>',
});
```

**优势:**
- 更简单的 API
- 无需管理 SMTP 服务器
- 更高的送达率
- 实时分析和监控

---

## 相关资源

### 官方文档

- [Resend 官网](https://resend.com/)
- [Resend 文档](https://resend.com/docs)
- [API 参考](https://resend.com/docs/api-reference)
- [SDK 文档](https://resend.com/docs/send-with-nextjs)

### 社区

- [GitHub](https://github.com/resendlabs/resend-node)
- [Discord](https://resend.com/discord)
- [Twitter](https://twitter.com/resend)

---

**配置完成后，您就可以开始使用 Newsletter 功能了！** 🚀

