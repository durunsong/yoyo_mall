# 🔐 YOYO Mall 测试账号

**重要提示**: 这些是开发/测试环境的账号，请勿在生产环境使用！

---

## 管理员账号 (Super Admin)

### 账号信息
- **邮箱**: `admin@yoyomall.com`
- **密码**: `admin123456`
- **角色**: 超级管理员 (SUPER_ADMIN)
- **姓名**: 系统管理员

### 权限
✅ 完全访问管理后台 (`/admin`)
- 用户管理
- 商品管理
- 订单管理
- 数据分析
- 系统设置

### 访问方式
1. 访问 `http://localhost:3000`
2. 点击右上角"登录"
3. 输入邮箱和密码
4. 登录后点击顶部导航栏的"Admin"进入后台

---

## 普通用户账号 (Customer)

### 账号信息
- **邮箱**: `user@example.com`
- **密码**: `password123`
- **角色**: 普通用户 (CUSTOMER)
- **姓名**: 测试用户
- **手机**: 13800138000

### 权限
✅ 前台用户功能
- 浏览商品
- 加入购物车
- 下单购买
- 管理订单
- 收藏商品
- 管理地址
- 修改个人信息

### 访问方式
1. 访问 `http://localhost:3000`
2. 点击右上角"登录"
3. 输入邮箱和密码

---

## 快速登录

### 方法1: 网页登录
```
URL: http://localhost:3000
点击: 右上角 "登录" 按钮
```

### 方法2: 直接访问登录页
```
http://localhost:3000/auth/login
```

---

## 如何重置密码？

### 如果忘记密码，有以下方法：

#### 方法1: 重新运行种子数据（推荐）
```bash
# 重置数据库并创建测试账号
pnpm prisma migrate reset --force

# 或者只运行种子数据
pnpm prisma db seed
```
**注意**: 这会清空所有数据并重新创建！

#### 方法2: 使用数据库工具修改
```bash
# 打开 Prisma Studio
pnpm prisma studio

# 然后在浏览器中修改用户密码（需要bcrypt加密）
```

#### 方法3: 创建新账号
直接在网站上点击"注册"创建新账号

---

## 密码加密说明

项目使用 `bcrypt` 加密密码（12轮加密）：

```typescript
// 示例：如何生成密码哈希
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash('your-password', 12);
```

如果需要在数据库中直接修改密码，请使用上述方法生成哈希值。

---

## 常见问题

### Q1: 登录显示"邮箱或密码错误"？
**可能原因**:
1. 数据库未运行种子数据
2. 密码输入错误（区分大小写）
3. 数据库连接问题

**解决方法**:
```bash
# 1. 检查数据库是否运行
# 2. 重新运行种子数据
pnpm prisma db seed
```

### Q2: 如何创建新的管理员账号？
**方法1**: 通过API创建
```bash
POST /api/admin/create-admin
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "password": "secure-password",
  "name": "新管理员"
}
```

**方法2**: 在现有管理员后台创建
1. 登录管理员账号
2. 访问 `/admin/users`
3. 创建新用户并设置角色为 ADMIN

### Q3: 可以修改默认密码吗？
**可以！** 编辑 `prisma/seed.ts` 文件：

```typescript
// 第21行
password: await bcrypt.hash('你的新密码', 12),

// 第43行
password: await bcrypt.hash('你的新密码', 12),
```

然后重新运行: `pnpm prisma db seed`

---

## 安全提示 ⚠️

### 开发环境
- ✅ 使用这些测试账号
- ✅ 密码可以简单一些
- ✅ 可以共享给团队

### 生产环境
- ❌ **切勿使用这些默认账号**
- ✅ 使用强密码（至少12位，包含大小写字母、数字、特殊字符）
- ✅ 启用双因素认证（如果支持）
- ✅ 定期更换密码
- ✅ 使用环境变量存储敏感信息

---

## 相关文件

- **种子数据**: `prisma/seed.ts` - 查看账号创建逻辑
- **用户模型**: `prisma/schema.prisma` - User 模型定义
- **登录API**: `src/app/api/auth/[...nextauth]/route.ts` - NextAuth配置
- **环境变量**: `.env.local` - 数据库连接配置

---

## 快速测试流程

### 测试管理员功能
1. 使用 `admin@yoyomall.com` 登录
2. 访问 `/admin` 管理后台
3. 测试：
   - 用户管理
   - 商品管理
   - 订单管理
   - 数据分析

### 测试用户购物流程
1. 使用 `user@example.com` 登录
2. 浏览商品 → 加入购物车 → 结账
3. 测试：
   - 搜索商品
   - 收藏商品
   - 管理订单
   - 修改个人信息

---

**创建日期**: 2025-10-28  
**最后更新**: 2025-10-28  
**状态**: ✅ 可用

如有问题，请查看 `docs/快速启动指南.md` 获取更多帮助。




