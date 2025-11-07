# Newsletter 功能快速开始 🚀

这是一个 5 分钟快速开始指南，帮助你快速配置和测试 Newsletter 功能。

---

## ⚡ 快速配置（3 步）

### 步骤 1: 获取 Resend API Key

1. 访问 [resend.com](https://resend.com/) 并注册账号
2. 进入 Dashboard → API Keys
3. 点击 "Create API Key"
4. 复制生成的 API Key（格式：`re_xxx...`）

### 步骤 2: 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# 发件人邮箱（测试阶段可以使用 Resend 提供的测试域名）
RESEND_FROM_EMAIL="Yobuy <onboarding@resend.dev>"

# 应用 URL（生产环境必须配置为实际域名）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**注意:** 测试域名 `onboarding@resend.dev` 只能发送到你在 Resend 注册的邮箱。

### 步骤 3: 运行数据库迁移

```bash
pnpm prisma migrate dev
```

---

## 🧪 快速测试

### 1. 启动开发服务器

```bash
pnpm dev
```

### 2. 测试订阅功能

1. 打开浏览器访问 `http://localhost:3000`
2. 滚动到页面底部 Footer
3. 输入你在 Resend 注册的邮箱
4. 点击"订阅"按钮
5. 查收验证邮件（检查收件箱和垃圾邮件文件夹）
6. 点击邮件中的"验证邮箱地址"按钮
7. 应该会跳转到验证成功页面

### 3. 查看管理后台

1. 使用管理员账号登录
2. 访问 `http://localhost:3000/admin/newsletter`
3. 查看订阅者列表和统计信息

---

## ✅ 功能检查清单

测试以下功能确保一切正常：

- [ ] 在 Footer 输入邮箱可以订阅
- [ ] 收到欢迎验证邮件
- [ ] 点击验证链接跳转到成功页面
- [ ] 收到确认邮件
- [ ] 管理后台显示订阅者信息
- [ ] 可以导出 CSV 文件
- [ ] 取消订阅链接正常工作

---

## 🎯 下一步

### 验证自己的域名（生产环境必需）

1. 在 Resend Dashboard 添加你的域名
2. 配置 DNS 记录（SPF、DKIM、DMARC）
3. 等待验证通过（通常 10-30 分钟）
4. 更新 `.env.local` 中的 `RESEND_FROM_EMAIL`：

```bash
RESEND_FROM_EMAIL="Yobuy <noreply@yourdomain.com>"
```

### 部署到生产环境

1. 在 Vercel/其他平台配置环境变量：
   ```
   RESEND_API_KEY=re_xxx...
   RESEND_FROM_EMAIL=Yobuy <noreply@yourdomain.com>
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. 部署项目

3. 测试生产环境的邮件发送

---

## 📖 详细文档

查看完整文档了解更多：

- **Newsletter 使用指南**: `docs/Newsletter使用指南.md`
- **Resend 配置指南**: `docs/Resend配置指南.md`
- **API 文档**: 包含在使用指南中

---

## ❓ 常见问题

### Q: 没有收到验证邮件？

**A:** 
1. 检查垃圾邮件文件夹
2. 确认 `RESEND_API_KEY` 配置正确
3. 使用测试域名时，只能发送到注册邮箱
4. 查看服务器日志确认是否有错误

### Q: 验证链接无效？

**A:**
1. 检查 `NEXT_PUBLIC_APP_URL` 是否配置
2. 确认链接完整（没有被截断）
3. 检查数据库中的 verifyToken

### Q: 如何发送营销邮件？

**A:** 
批量发送功能正在开发中。当前可以：
1. 导出订阅者列表（CSV）
2. 使用第三方邮件营销工具
3. 或等待后续更新

---

## 🆘 获取帮助

如果遇到问题：

1. 查看 [Resend 文档](https://resend.com/docs)
2. 检查服务器日志和浏览器控制台
3. 查看 Resend Dashboard 的发送记录
4. 联系技术支持团队

---

## 🎉 完成！

恭喜！Newsletter 功能已经配置完成。现在你可以：

- ✅ 收集用户邮箱订阅
- ✅ 发送精美的验证邮件
- ✅ 管理订阅者列表
- ✅ 导出订阅者数据

开始构建你的邮件营销策略吧！📧

