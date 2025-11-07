# ⚠️ Newsletter 功能配置缺失

## 问题

你看到这个错误是因为 **Resend 邮件服务未配置**。

错误信息：`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

这表示 API 返回了 HTML 错误页面而不是 JSON 响应。

---

## 快速解决方案（5 分钟）

### 步骤 1: 注册 Resend

1. 访问 [https://resend.com](https://resend.com)
2. 使用 GitHub 或邮箱注册（免费）
3. 验证邮箱

### 步骤 2: 获取 API Key

1. 登录后进入 Dashboard
2. 点击左侧菜单 "API Keys"
3. 点击 "Create API Key"
4. 输入名称（如 "Yobuy Dev"）
5. 复制生成的 API Key（格式：`re_xxxxxxxxxxxxx`）

### 步骤 3: 配置环境变量

在项目根目录创建或编辑 `.env.local` 文件，添加：

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# 发件人邮箱（测试阶段使用）
RESEND_FROM_EMAIL="Yobuy <onboarding@resend.dev>"

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**注意：**
- ✅ 使用 `.env.local` 文件（不要提交到 Git）
- ✅ `onboarding@resend.dev` 是 Resend 提供的测试域名
- ✅ 测试域名只能发送到你在 Resend 注册的邮箱

### 步骤 4: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
pnpm dev
```

### 步骤 5: 测试

1. 打开浏览器访问 `http://localhost:3000`
2. 滚动到 Footer 的 Newsletter 订阅区域
3. 输入你在 Resend 注册的邮箱
4. 点击"订阅"按钮
5. 检查邮箱（包括垃圾邮件文件夹）

---

## 免费额度

Resend 免费计划包括：
- ✅ 100 封邮件/天
- ✅ 3,000 封邮件/月
- ✅ 完全够开发和测试使用

---

## 生产环境配置

### 验证自己的域名（推荐）

1. 在 Resend Dashboard 添加你的域名
2. 配置 DNS 记录（SPF、DKIM、DMARC）
3. 等待验证通过（10-30 分钟）
4. 更新环境变量：

```bash
RESEND_FROM_EMAIL="Yobuy <noreply@yourdomain.com>"
```

---

## 详细文档

查看完整配置指南：

- 📖 **快速开始**: `docs/Newsletter快速开始.md`
- 📖 **Resend 配置**: `docs/Resend配置指南.md`
- 📖 **完整指南**: `docs/Newsletter使用指南.md`

---

## 临时解决方案（不推荐）

如果暂时不想配置邮件服务，可以注释掉 Footer 中的 Newsletter 订阅表单：

在 `src/components/layout/footer.tsx` 中：

```tsx
{/* 暂时禁用 Newsletter
<div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12">
  ...
</div>
*/}
```

但这样会失去邮件订阅功能。

---

## 获取帮助

如果仍有问题：

1. 检查 `.env.local` 文件是否在项目根目录
2. 确认 API Key 格式正确（以 `re_` 开头）
3. 查看终端日志是否有其他错误
4. 参考 `docs/Newsletter快速开始.md` 完整步骤

---

**配置完成后，Newsletter 功能就可以正常使用了！** 🚀

