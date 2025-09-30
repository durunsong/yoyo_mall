# YOYO Mall 完整设置指南

## 🎉 项目已完成核心功能

恭喜！您的跨境电商网站核心功能已经完成。以下是完整的设置和使用指南。

## ✅ 已完成的功能

### 前台功能
- ✅ **首页**: 特色商品展示、分类导航、热门推荐
- ✅ **商品列表**: 搜索、筛选、排序、分页
- ✅ **商品详情**: 图片画廊、规格选择、库存显示、相关推荐
- ✅ **购物车**: 商品管理、数量调整、优惠券应用
- ✅ **结算流程**: 地址填写、支付处理（Stripe集成）
- ✅ **用户中心**: 订单管理、个人信息、账户概览

### 后端功能
- ✅ **完整数据库模型**: 用户、商品、订单、支付、库存等
- ✅ **API接口**: RESTful API设计
- ✅ **用户认证**: NextAuth.js集成
- ✅ **支付集成**: Stripe支付系统
- ✅ **国际化**: 中英文双语支持

## 🚀 快速启动

### 1. 环境准备

确保已安装：
- Node.js 18+
- PostgreSQL
- pnpm (推荐) 或 npm

### 2. 克隆并安装

```bash
# 克隆项目
git clone <your-repo>
cd yoyo_mall

# 安装依赖
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/yoyo_mall"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"  # 运行: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Stripe (测试密钥)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="YOYO Mall"
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库模型
pnpm db:push

# 填充测试数据
pnpm db:seed
```

### 5. 启动项目

```bash
# 开发模式
pnpm dev

# 访问 http://localhost:3000
```

## 👤 测试账户

### 管理员账户
- **邮箱**: `admin@yoyomall.com`
- **密码**: `admin123456`

### 普通用户
- **邮箱**: `user@example.com`
- **密码**: `password123`

## 🛍️ 完整购物流程

1. **浏览商品**
   - 访问首页查看推荐商品
   - 进入商品列表页浏览更多
   - 使用搜索和筛选功能

2. **查看详情**
   - 点击商品卡片查看详情
   - 选择数量
   - 添加到购物车

3. **购物车管理**
   - 访问 `/cart` 查看购物车
   - 调整商品数量
   - 应用优惠券 (测试码: `WELCOME10`)

4. **结算支付**
   - 点击"结算"按钮
   - 填写配送地址
   - 使用测试卡号支付:
     - 卡号: `4242 4242 4242 4242`
     - 有效期: 任意未来日期
     - CVC: 任意3位数

5. **查看订单**
   - 访问 `/account/orders` 查看订单历史
   - 跟踪订单状态

## 📁 项目结构

```
yoyo_mall/
├── src/
│   ├── app/                    # Next.js 页面
│   │   ├── [locale]/          # 国际化路由
│   │   ├── products/          # 商品页面
│   │   ├── cart/              # 购物车
│   │   ├── (shop)/checkout/   # 结算
│   │   ├── account/           # 用户中心
│   │   └── api/               # API路由
│   ├── components/            # React组件
│   ├── hooks/                 # 自定义Hooks
│   ├── store/                 # 状态管理
│   ├── lib/                   # 工具库
│   └── types/                 # TypeScript类型
├── prisma/                    # 数据库
│   ├── schema.prisma         # 数据模型
│   └── seed.ts               # 种子数据
└── docs/                      # 文档
```

## 🔧 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 数据库
pnpm db:generate      # 生成Prisma Client
pnpm db:push          # 推送数据库模型
pnpm db:seed          # 填充种子数据
pnpm db:studio        # 打开Prisma Studio

# 代码质量
pnpm lint             # 代码检查
pnpm type-check       # 类型检查
```

## 🌐 多语言切换

- 中文: `http://localhost:3000/zh-CN`
- English: `http://localhost:3000/en-US`

## 📊 已完成的页面

### 用户前台
- ✅ `/` - 首页
- ✅ `/products` - 商品列表
- ✅ `/products/[id]` - 商品详情
- ✅ `/cart` - 购物车
- ✅ `/checkout` - 结算
- ✅ `/account` - 用户中心
- ✅ `/account/orders` - 订单管理

### API端点
- ✅ `GET /api/products` - 商品列表
- ✅ `GET /api/products/[id]` - 商品详情
- ✅ `GET /api/categories` - 分类列表
- ✅ `GET /api/cart` - 购物车
- ✅ `POST /api/cart` - 添加到购物车
- ✅ `POST /api/orders` - 创建订单
- ✅ `POST /api/payments/stripe/create-intent` - 创建支付
- ✅ `POST /api/auth/register` - 用户注册

## 🎨 使用的图片

项目使用了 Unsplash 的免费图片作为商品展示：
- iPhone: `https://images.unsplash.com/photo-1592286927505-2fd5ee15aef3`
- MacBook: `https://images.unsplash.com/photo-1517336714731-489689fd1ca8`
- AirPods: `https://images.unsplash.com/photo-1600294037681-c80b4cb5b434`
- Samsung: `https://images.unsplash.com/photo-1610945415295-d9bbf067e59c`
- Nike鞋: `https://images.unsplash.com/photo-1542291026-7eec264c27ff`
- T恤: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab`
- 办公椅: `https://images.unsplash.com/photo-1580480055273-228ff5388ef8`
- 书架: `https://images.unsplash.com/photo-1594620302200-9a762244a156`

## 🚧 待开发功能

### 高优先级
- [ ] 管理后台完善
- [ ] 订单详情页
- [ ] 地址管理
- [ ] 评价系统

### 中优先级
- [ ] 心愿单功能
- [ ] 搜索优化
- [ ] 邮件通知
- [ ] 订单追踪

### 低优先级
- [ ] 社交分享
- [ ] 推荐系统
- [ ] 数据分析
- [ ] SEO优化

## 🐛 常见问题

### 数据库连接失败
```bash
# 确保PostgreSQL运行
# Windows: 检查服务
# Mac: brew services start postgresql

# 创建数据库
createdb yoyo_mall
```

### Stripe测试
- 使用测试密钥 (以 `pk_test_` 和 `sk_test_` 开头)
- 测试卡号: `4242 4242 4242 4242`
- 不会产生真实扣款

### 端口被占用
```bash
# 使用其他端口
pnpm dev -- -p 3001
```

## 📚 技术栈

- **前端**: Next.js 15, React 19, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **状态**: Zustand
- **数据库**: PostgreSQL, Prisma
- **认证**: NextAuth.js
- **支付**: Stripe
- **国际化**: next-i18next

## 🎯 下一步建议

1. **完善管理后台**
   - 商品CRUD操作
   - 订单管理
   - 用户管理
   - 数据统计

2. **优化用户体验**
   - 添加加载动画
   - 优化移动端体验
   - 添加骨架屏

3. **增强功能**
   - 商品评价
   - 心愿单
   - 优惠券管理
   - 邮件通知

4. **性能优化**
   - 图片优化
   - 代码分割
   - 缓存策略
   - SEO优化

5. **测试和部署**
   - 单元测试
   - E2E测试
   - 部署到Vercel
   - 配置CI/CD

## 📞 获取帮助

- 📖 查看项目文档: `/docs`
- 🐛 报告问题: GitHub Issues
- 💬 技术讨论: Discussions

## 🙏 致谢

感谢使用 YOYO Mall！祝您开发顺利！

---

**最后更新**: 2025-01-01
**版本**: 1.0.0
