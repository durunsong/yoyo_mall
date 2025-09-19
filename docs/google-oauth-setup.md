# Google OAuth 配置指南

本指南将帮您配置谷歌一键登录功能。

## 步骤 1: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API 和 Google Identity Service

## 步骤 2: 配置 OAuth 同意屏幕

1. 在左侧菜单中选择 **APIs & Services** > **OAuth consent screen**
2. 选择 **External** 用户类型
3. 填写必要信息：
   - 应用名称：`YOYO Mall`
   - 用户支持邮箱：您的邮箱
   - 开发者联系邮箱：您的邮箱
4. 添加作用域（可选，基本信息通常足够）
5. 添加测试用户（开发阶段）

## 步骤 3: 创建 OAuth 2.0 客户端 ID

1. 在左侧菜单中选择 **APIs & Services** > **Credentials**
2. 点击 **+ CREATE CREDENTIALS** > **OAuth client ID**
3. 选择应用类型：**Web application**
4. 设置名称：`YOYO Mall Web Client`
5. 添加授权的重定向 URI：
   - `http://localhost:3000` (开发环境)
   - `https://yourdomain.com` (生产环境)
6. 点击 **Create**

## 步骤 4: 获取凭据

创建完成后，您将获得：
- **Client ID** - 复制此值到 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **Client Secret** - 复制此值到 `GOOGLE_CLIENT_SECRET`

## 步骤 5: 配置环境变量

在您的 `.env.local` 文件中添加：

```bash
# Google OAuth配置
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## 步骤 6: 测试登录

1. 重启开发服务器：`pnpm dev`
2. 点击登录按钮，尝试谷歌登录
3. 检查浏览器控制台是否有错误信息

## 故障排除

### 常见错误

1. **Error 400: redirect_uri_mismatch**
   - 检查重定向 URI 是否正确配置
   - 确保开发环境使用 `http://localhost:3000`

2. **Error 403: access_blocked**
   - 确保 OAuth 同意屏幕已正确配置
   - 检查测试用户是否已添加

3. **Client ID 无效**
   - 确认 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 格式正确
   - 检查环境变量是否已正确设置

### 开发提示

- 在开发阶段，使用 `http://localhost:3000`
- 生产环境需要 HTTPS
- 确保域名与 OAuth 配置中的授权域名匹配

## 生产部署注意事项

1. 更新 OAuth 客户端的授权重定向 URI
2. 将 OAuth 同意屏幕设置为"已发布"状态
3. 考虑添加品牌信息和隐私政策链接

---

如需更多帮助，请参考 [Google Identity Platform 文档](https://developers.google.com/identity/gsi/web/guides/overview)。
