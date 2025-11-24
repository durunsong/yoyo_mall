# 🔒 安全配置指南

## ⚠️ 重要提醒

**请勿将包含真实密钥的配置文件提交到 Git 仓库!**

本项目已发生过 AccessKey 泄露事件,请务必遵循以下安全规范。

## 环境变量配置

### 1. 本地开发环境

1. 复制 `.env.local.safe` 为 `.env.local`:
   ```bash
   cp .env.local.safe .env.local
   ```

2. 在 `.env.local` 中填入您的真实密钥

3. **确认 `.env.local` 已被 `.gitignore` 忽略**

### 2. 生产环境

在部署平台(Vercel/Netlify等)的环境变量配置页面中设置,**不要**在代码中硬编码。

## 已泄露密钥处理流程

如果您的密钥已经被提交到 Git 仓库:

### 步骤 1: 立即禁用泄露的密钥

1. **阿里云 OSS**: 登录 [阿里云 RAM 控制台](https://ram.console.aliyun.com/users) 禁用并删除泄露的 AccessKey
2. **数据库**: 修改数据库密码
3. **Stripe**: 在 Stripe Dashboard 中撤销泄露的密钥
4. **其他服务**: 按照各服务商的安全指引操作

### 步骤 2: 生成新密钥

在各服务商控制台生成新的密钥,并更新到环境变量中。

### 步骤 3: 清理 Git 历史(可选但推荐)

使用 `git-filter-repo` 或 BFG Repo-Cleaner 清理历史记录:

```bash
# 安装 git-filter-repo
pip install git-filter-repo

# 清理包含敏感信息的文件
git filter-repo --path .env --invert-paths
git filter-repo --path .env.local --invert-paths

# 强制推送(谨慎操作!)
git push origin --force --all
```

⚠️ **注意**: 强制推送会改写历史,如果有协作者需要提前通知。

### 步骤 4: 更新 .gitignore

确保 `.gitignore` 包含:

```gitignore
.env
.env.local
.env*.local
.env.production
.env.development
```

## 安全检查清单

- [ ] `.env.local` 已被 `.gitignore` 忽略
- [ ] 代码中没有硬编码的密钥
- [ ] 文档中的示例使用占位符(如 `your_api_key`)
- [ ] 生产环境密钥仅在部署平台配置
- [ ] 定期轮换重要密钥
- [ ] 启用阿里云 RAM 子账号,限制权限范围

## 推荐的密钥管理方案

### 开发环境
- 使用 `.env.local` 存储本地密钥
- 团队成员各自管理自己的 `.env.local`

### 生产环境
- 使用部署平台的环境变量功能
- 使用密钥管理服务(如 AWS Secrets Manager、阿里云 KMS)

## 参考资源

- [阿里云 AccessKey 安全最佳实践](https://help.aliyun.com/document_detail/28627.html)
- [GitHub 密钥扫描](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP 密钥管理指南](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

## 联系方式

如发现安全问题,请通过以下方式联系:
- GitHub Issues (标记为 `security`)
- Email: durunsong@sailvan.com

