# Resend 邮件服务配置和测试指南

## ✅ 已完成配置

您的 Resend API Key 已经配置完成！

```bash
RESEND_API_KEY="re_BfZdEMtp_G6oxMvGaC1f3k1sNSszEifkY"
RESEND_FROM_EMAIL="Yobuy <onboarding@resend.dev>"
```

---

## 📧 测试阶段说明

### 当前配置（测试阶段）

使用 Resend 提供的测试域名 `onboarding@resend.dev`：

**限制**：
- ✅ 免费使用
- ⚠️ 只能发送到**你注册 Resend 时使用的邮箱**
- ⚠️ 不能发送给其他邮箱地址

**适用场景**：
- 开发测试
- 功能验证
- 本地调试

---

## 🧪 测试 Newsletter 功能

### 1. 启动项目

```bash
npm run dev
```

### 2. 访问首页

打开浏览器访问 `http://localhost:3000`

### 3. 找到 Newsletter 订阅区域

在页面底部（Footer）找到"订阅我们的新闻"输入框

### 4. 输入邮箱测试

**重要**：必须使用你注册 Resend 时使用的邮箱！

```
例如：如果你用 your-email@gmail.com 注册的 Resend
那么测试时就必须输入 your-email@gmail.com
```

### 5. 点击订阅

点击"订阅"按钮

### 6. 查收验证邮件

- 打开你注册 Resend 的邮箱
- 查找来自 "Yobuy" 的邮件
- 主题：订阅确认 / Newsletter Subscription Confirmation
- 点击邮件中的验证链接

### 7. 完成验证

点击验证链接后，浏览器会跳转到确认页面，显示"订阅成功"

---

## 🎯 测试检查清单

- [ ] Newsletter 表单可以正常提交
- [ ] 提交后显示"验证邮件已发送"提示
- [ ] 邮箱收到验证邮件（检查垃圾邮件文件夹）
- [ ] 邮件中的验证链接可以点击
- [ ] 点击后跳转到确认页面
- [ ] 确认页面显示"订阅成功"

---

## 📊 Resend 免费额度

### 当前套餐限制

- 每月：**3,000** 封邮件
- 每天：**100** 封邮件
- 自定义域名：**1** 个

### 升级选项

如果超出免费额度，可以升级到付费套餐：

- Pro：$20/月，50,000 封邮件
- Enterprise：联系销售，无限制

---

## 🚀 生产环境配置（验证自定义域名）

### 为什么要验证域名？

- ✅ 可以使用 `noreply@your-domain.com` 等专业邮箱
- ✅ 可以发送给任意邮箱地址
- ✅ 提高邮件送达率
- ✅ 避免被标记为垃圾邮件

### 验证步骤

#### 1. 添加域名

1. 访问 [Resend Dashboard](https://resend.com/domains)
2. 点击 "Add Domain"
3. 输入你的域名（如：`your-domain.com`）

#### 2. 添加 DNS 记录

Resend 会提供以下 DNS 记录，需要在你的域名服务商添加：

**MX 记录**（邮件接收）：
```
Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**SPF 记录**（防止伪造）：
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

**DKIM 记录**（邮件签名）：
```
Type: TXT
Name: resend._domainkey
Value: [Resend 提供的值]
```

**DMARC 记录**（邮件策略）：
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
```

#### 3. 等待验证

- DNS 记录传播需要 **几分钟到几小时**
- 在 Resend Dashboard 查看验证状态
- 验证成功后会显示绿色的 ✓ 标记

#### 4. 更新环境变量

验证成功后，更新 `.env.local`：

```bash
# 注释掉测试邮箱
# RESEND_FROM_EMAIL="Yobuy <onboarding@resend.dev>"

# 使用自定义域名邮箱
RESEND_FROM_EMAIL="Yobuy <noreply@your-domain.com>"
```

#### 5. 重启应用

```bash
# 停止应用
Ctrl + C

# 重新启动
npm run dev
```

---

## 📋 常见 DNS 服务商配置指南

### Cloudflare

1. 登录 Cloudflare
2. 选择域名
3. DNS → 添加记录
4. 添加 Resend 提供的所有记录
5. 保存

### Vercel

1. Vercel Dashboard → Domains
2. 选择域名 → DNS
3. 添加记录
4. 保存

### 阿里云

1. 域名控制台
2. 解析设置
3. 添加记录
4. 保存

### GoDaddy

1. 登录 GoDaddy
2. 我的产品 → DNS
3. 添加记录
4. 保存

---

## 🐛 常见问题排查

### Q1: 没有收到验证邮件

**可能原因**：
1. 邮箱地址不是注册 Resend 的邮箱（测试阶段）
2. 邮件在垃圾邮件文件夹
3. API Key 配置错误
4. 网络问题

**解决方法**：
1. 检查 `.env.local` 中的 `RESEND_API_KEY`
2. 查看浏览器控制台是否有错误
3. 查看服务器终端日志
4. 检查垃圾邮件文件夹
5. 等待几分钟后重试

### Q2: 提示 "Resend API Key not configured"

**原因**：环境变量未加载

**解决方法**：
1. 确认 `.env.local` 文件存在
2. 确认 `RESEND_API_KEY` 已配置
3. 重启开发服务器：
```bash
Ctrl + C
npm run dev
```

### Q3: 邮件发送失败

**检查步骤**：

1. 查看终端日志：
```bash
# 应该看到类似的日志
POST /api/newsletter/subscribe 200
```

2. 检查 API Key 是否正确：
```bash
# 打开 .env.local
# 确认格式：re_xxxxxxxxxxxxx
```

3. 测试 API Key：
访问 [Resend Dashboard](https://resend.com/api-keys) 确认 Key 状态为 "Active"

### Q4: 域名验证一直失败

**可能原因**：
1. DNS 记录未添加
2. DNS 记录值错误
3. DNS 传播未完成

**解决方法**：
1. 使用 DNS 检查工具验证记录：
   - https://mxtoolbox.com/
   - https://dnschecker.org/

2. 等待 24-48 小时（DNS 传播时间）

3. 联系 Resend 支持：support@resend.com

---

## 📚 相关文档

- [Resend 官方文档](https://resend.com/docs)
- [域名验证指南](https://resend.com/docs/dashboard/domains/introduction)
- [API 参考](https://resend.com/docs/api-reference/emails/send-email)
- [环境变量完整配置指南](./环境变量完整配置指南.md)

---

## 💡 最佳实践

### 开发环境
- ✅ 使用 `onboarding@resend.dev` 测试
- ✅ 只发送到自己的邮箱
- ✅ 频繁测试以验证功能

### 生产环境
- ✅ 验证自定义域名
- ✅ 使用专业邮箱地址（如 noreply@）
- ✅ 监控发送额度
- ✅ 设置 DMARC 策略
- ✅ 定期检查送达率

### 安全提示
- ⚠️ 不要将 API Key 提交到 Git
- ⚠️ 不要在客户端代码中使用 API Key
- ⚠️ 定期轮换 API Key
- ⚠️ 在 Resend Dashboard 监控使用情况

---

## 🎉 下一步

配置完成后，您可以：

1. **测试 Newsletter 功能**
   - 前往首页底部订阅
   - 验证邮件接收和链接

2. **查看订阅者列表**
   - 访问 `/admin/subscribers`（需要管理员权限）
   - 查看所有订阅者

3. **发送群发邮件**
   - 使用 Resend API 发送营销邮件
   - 实现自动化邮件通知

4. **监控邮件状态**
   - 在 Resend Dashboard 查看发送日志
   - 追踪打开率和点击率

---

**配置日期**: 2024-11-05  
**API Key**: re_BfZdEMtp_G6oxMvGaC1f3k1sNSszEifkY  
**状态**: ✅ 已配置，可以测试
