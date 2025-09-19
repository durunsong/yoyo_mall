# 认证弹窗使用指南

我们已经成功实现了一个完整的登录注册弹窗系统，具备以下特性：

## ✨ 功能特色

### 🔐 登录功能
- 支持用户名/邮箱/手机号登录
- 密码输入支持显示/隐藏切换
- "记住我"选项
- "忘记密码"链接
- 演示账户信息提示

### 📝 注册功能
- 完整的用户信息收集（用户名、邮箱、手机号）
- 实时密码强度检测和可视化指示器
- 密码确认验证
- 用户协议和隐私政策同意
- 详细的表单验证规则

### 🔒 密码强度校验
- 8位最小长度要求
- 大小写字母检测
- 数字字符检测  
- 特殊字符检测
- 实时强度评分（弱/中/强）
- 彩色进度条显示
- 具体建议提示

### 🌐 谷歌一键登录
- 集成 `@react-oauth/google`
- 支持登录和注册场景
- 响应式按钮设计
- 错误处理

## 🎯 使用方法

### 1. 基本使用

```tsx
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuthModal } from '@/hooks/use-auth-modal';

function App() {
  const { isOpen, defaultTab, openModal, closeModal } = useAuthModal();

  return (
    <div>
      <button onClick={() => openModal('login')}>登录</button>
      <button onClick={() => openModal('register')}>注册</button>
      
      <AuthModal 
        open={isOpen}
        onClose={closeModal}
        defaultTab={defaultTab}
      />
    </div>
  );
}
```

### 2. 集成到头部导航

组件已经集成到以下导航组件中：
- `src/components/layout/antd-header.tsx` - Ant Design版本
- `src/components/layout/header.tsx` - 常规版本

### 3. 弹窗状态管理

使用 `useAuthModal` Hook 管理弹窗状态：

```tsx
const { 
  isOpen,      // 弹窗是否打开
  defaultTab,  // 默认标签页 ('login' | 'register')
  openModal,   // 打开弹窗函数
  closeModal,  // 关闭弹窗函数
  switchTab    // 切换标签页函数
} = useAuthModal();
```

## 🔧 配置选项

### 谷歌OAuth配置

在 `.env.local` 中配置：

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

详细配置请参考 [Google OAuth 配置指南](./google-oauth-setup.md)

### 密码强度规则

当前密码强度规则：
- ✅ 长度至少8位 (20分)
- ✅ 包含小写字母 (20分)  
- ✅ 包含大写字母 (20分)
- ✅ 包含数字 (20分)
- ✅ 包含特殊字符 (20分)

总分100分：
- 0-39分：弱（红色）
- 40-79分：中（橙色）  
- 80-100分：强（绿色）

## 🎨 样式定制

### 弹窗尺寸
```tsx
<Modal
  width={500}        // 可调整宽度
  centered           // 居中显示
  maskClosable={false} // 禁止点击遮罩关闭
>
```

### 密码强度指示器
```tsx
<Progress 
  percent={passwordStrength.score} 
  strokeColor={passwordStrength.color}
  showInfo={false}
  size="small"
/>
```

## 🔄 API 集成

### 登录API
```tsx
const handleLogin = async (values: LoginFormValues) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    // 处理响应...
  } catch (error) {
    // 错误处理...
  }
};
```

### 注册API
```tsx
const handleRegister = async (values: RegisterFormValues) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    // 处理响应...
  } catch (error) {
    // 错误处理...
  }
};
```

### 谷歌OAuth API
```tsx
const handleGoogleSuccess = async (credentialResponse: any) => {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credentialResponse.credential })
    });
    // 处理响应...
  } catch (error) {
    // 错误处理...
  }
};
```

## 📱 响应式设计

- 弹窗在移动端自动适应屏幕宽度
- 谷歌登录按钮支持响应式宽度
- 表单元素在小屏幕上优化显示

## 🐛 故障排除

### 常见问题

1. **谷歌登录按钮不显示**
   - 检查 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 环境变量
   - 确认谷歌OAuth客户端配置正确

2. **密码强度不更新**
   - 确保 `onChange` 事件正确绑定
   - 检查 `handlePasswordChange` 函数调用

3. **弹窗无法打开**
   - 确认 `useAuthModal` Hook 正确使用
   - 检查 `AuthModal` 组件是否正确引入

## 🚀 后续扩展

可以考虑添加的功能：
- 微信登录集成
- 短信验证码登录
- 双因素认证
- 社交媒体登录（GitHub、Facebook等）
- 生物识别登录（指纹、面部识别）

---

如有问题，请查看相关组件源码或联系开发团队。
