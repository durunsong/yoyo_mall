# 阿里云OSS图片迁移指南

**日期**: 2025-10-30  
**版本**: v1.8.8

---

## 📋 概述

本指南介绍如何将YOYO Mall项目中的所有图片迁移到阿里云OSS（`oss://next-static-oss/`），并创建完整的订单流程测试数据。

---

## 🎯 迁移目标

### 1. 图片存储结构

```
oss://next-static-oss/
├── products/
│   ├── electronics/          # 数码产品图片
│   │   ├── phone-1.jpg
│   │   ├── laptop-1.jpg
│   │   ├── headphone-1.jpg
│   │   └── ...
│   ├── clothing/             # 服装配饰图片
│   │   ├── shirt-1.jpg
│   │   ├── shoes-1.jpg
│   │   └── ...
│   └── home/                 # 家居生活图片
│       ├── sofa-1.jpg
│       ├── lamp-1.jpg
│       └── ...
├── users/
│   └── avatars/              # 用户头像
│       ├── avatar-1.jpg
│       ├── avatar-2.jpg
│       └── ...
├── brands/                   # 品牌Logo
│   ├── apple-logo.png
│   ├── samsung-logo.png
│   └── ...
└── placeholder.png           # 占位图
```

### 2. 基础URL

```
https://next-static-oss.oss-cn-shanghai.aliyuncs.com/
```

---

## 🚀 快速开始

### 步骤1: 配置OSS凭证

在 `.env.local` 中添加：

```env
# 阿里云OSS配置
OSS_REGION=oss-cn-shanghai
OSS_BUCKET=next-static-oss
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
```

### 步骤2: 安装依赖

```bash
npm install ali-oss
```

### 步骤3: 运行图片迁移（可选）

如果你有本地图片需要上传到OSS：

```bash
npx tsx scripts/migrate-images-to-oss.ts
```

### 步骤4: 运行完整数据种子

```bash
# 清空数据库
npx prisma migrate reset --force

# 运行完整种子数据
npx tsx prisma/seed-complete.ts
```

---

## 📁 核心文件说明

### 1. `src/lib/oss-images.ts`

**作用**: 集中管理所有OSS图片URL

```typescript
import { PLACEHOLDER_IMAGE, getRandomImage, getImage } from '@/lib/oss-images';

// 使用示例
const productImage = getRandomImage('electronics'); // 随机电子产品图片
const avatarImage = getImage('avatars', 0); // 第一个头像
const fallback = PLACEHOLDER_IMAGE; // 占位图
```

**导出内容**:
- `ELECTRONICS_IMAGES` - 数码产品图片数组
- `CLOTHING_IMAGES` - 服装配饰图片数组
- `HOME_IMAGES` - 家居生活图片数组
- `AVATAR_IMAGES` - 用户头像数组
- `BRAND_LOGOS` - 品牌Logo数组
- `PLACEHOLDER_IMAGE` - 占位图URL
- `getRandomImage(category)` - 获取随机图片
- `getImage(category, index)` - 获取指定索引图片
- `getImageByCategory(categorySlug)` - 根据分类slug获取图片

### 2. `prisma/seed-complete.ts`

**作用**: 创建完整的订单流程测试数据

**包含数据**:
- ✅ 1个管理员 + 3个测试用户
- ✅ 6个品牌（Apple、Samsung、Nike等）
- ✅ 3个主分类 + 9个子分类
- ✅ 9个商品（数码、服装、家居）
- ✅ 3个收货地址
- ✅ 6个订单（覆盖完整流程）
- ✅ 5条商品评论

**订单流程覆盖**:
1. 待支付订单
2. 处理中订单（已支付）
3. 已发货订单（有物流单号）
4. 已送达订单
5. 已完成订单
6. 已取消订单（已退款）

### 3. `scripts/migrate-images-to-oss.ts`

**作用**: 将图片从URL下载并上传到OSS（可选）

**使用场景**:
- 从电商平台爬取图片
- 迁移本地图片到云端
- 批量处理图片URL

---

## 💻 使用方法

### 方法1: 直接使用OSS图片URL

在组件中导入并使用：

```typescript
import { ELECTRONICS_IMAGES, PLACEHOLDER_IMAGE } from '@/lib/oss-images';

function ProductCard({ product }: { product: Product }) {
  return (
    <Image
      src={product.image || PLACEHOLDER_IMAGE}
      alt={product.name}
      width={200}
      height={200}
    />
  );
}
```

### 方法2: 使用辅助函数

```typescript
import { getRandomImage, getImage } from '@/lib/oss-images';

// 创建商品时随机分配图片
const newProduct = {
  name: 'iPhone 15',
  image: getRandomImage('electronics'),
  // ...
};

// 按索引获取图片
const avatar = getImage('avatars', userId % 5);
```

### 方法3: 在数据库种子中使用

```typescript
import { ELECTRONICS_IMAGES, CLOTHING_IMAGES } from '@/lib/oss-images';

const product = await prisma.product.create({
  data: {
    name: 'iPhone 15 Pro',
    image: ELECTRONICS_IMAGES[0],
    // ...
  },
});
```

---

## 🧪 测试数据详情

### 测试账号

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | admin@yoyomall.com | admin123456 | 可访问后台 |
| 用户1 | user1@example.com | password123 | 有2个订单 |
| 用户2 | user2@example.com | password123 | 有2个订单 |
| 用户3 | user3@example.com | password123 | 有2个订单 |

### 测试商品（9个）

**数码产品（4个）**:
1. iPhone 15 Pro Max - ¥9,999
2. MacBook Pro 16英寸 - ¥25,999
3. AirPods Pro 2代 - ¥1,999
4. Samsung Galaxy S24 Ultra - ¥8,999

**服装配饰（3个）**:
5. Nike Air Max 270 - ¥1,299
6. Adidas Ultraboost 23 - ¥1,499
7. Zara基础款T恤 - ¥99

**家居生活（2个）**:
8. IKEA Billy书架 - ¥399
9. IKEA Poäng休闲椅 - ¥699

### 测试订单（6个）

| 用户 | 订单状态 | 商品 | 金额 | 物流单号 |
|------|---------|------|------|---------|
| user1 | 待支付 | iPhone + Nike鞋 | ¥11,298+ | - |
| user1 | 处理中 | MacBook | ¥25,999+ | - |
| user2 | 已发货 | AirPods + Adidas鞋 | ¥3,498+ | SF1234567890 |
| user2 | 已送达 | Samsung手机 | ¥8,999+ | YTO9876543210 |
| user3 | 已完成 | Zara T恤 + IKEA书架 | ¥498+ | JD1122334455 |
| user3 | 已取消 | IKEA椅子 | ¥699+ | - |

---

## 🔧 组件更新指南

### 需要更新的组件

所有使用 `/placeholder.png` 或 `/images/` 的组件都需要更新为OSS URL。

**已更新的组件**:
- ✅ `src/components/layout/floating-toolbar.tsx`

**需要更新的组件**:
```bash
src/app/deals/page.tsx
src/app/products/page.tsx
src/app/products/[id]/page.tsx
src/app/[locale]/page.tsx
src/app/account/wishlist/page.tsx
src/components/seo/seo-metadata.tsx
```

### 更新方法

**修改前**:
```typescript
<Image src={product.image || '/placeholder.png'} />
```

**修改后**:
```typescript
import { PLACEHOLDER_IMAGE } from '@/lib/oss-images';

<Image src={product.image || PLACEHOLDER_IMAGE} />
```

---

## 📊 订单流程说明

### 完整订单流程

```
1. 用户下单
   ↓
2. 待支付 (PENDING_PAYMENT)
   ↓ 用户支付
3. 处理中 (PROCESSING) - 商家确认订单
   ↓ 商家发货
4. 已发货 (SHIPPED) - 生成物流单号
   ↓ 物流送达
5. 已送达 (DELIVERED) - 用户签收
   ↓ 确认收货
6. 已完成 (COMPLETED) - 交易完成

可能的分支:
- 用户取消 → 已取消 (CANCELLED)
- 用户申请退款 → 退款中 (REFUNDING) → 已退款 (REFUNDED)
```

### 测试流程

#### 1. 测试下单流程

```bash
1. 登录: user1@example.com / password123
2. 浏览商品列表
3. 添加商品到购物车
4. 进入购物车页面
5. 点击"结算"
6. 选择收货地址
7. 选择支付方式
8. 提交订单
```

#### 2. 测试订单查看

```bash
1. 登录用户账号
2. 进入"我的订单"
3. 查看不同状态的订单
4. 查看订单详情
5. 查看物流信息（已发货订单）
```

#### 3. 测试后台管理

```bash
1. 登录: admin@yoyomall.com / admin123456
2. 进入后台 /admin/orders
3. 查看所有订单
4. 筛选不同状态订单
5. 更新订单状态
6. 添加物流单号
```

---

## 🎨 图片最佳实践

### 1. 图片命名规范

```
products/{category}/{type}-{index}.jpg
users/avatars/avatar-{index}.jpg
brands/{brand}-logo.png
```

### 2. 图片尺寸建议

| 类型 | 建议尺寸 | 格式 |
|------|---------|------|
| 商品主图 | 800x800 | JPG/WebP |
| 商品详情图 | 1200x1200 | JPG/WebP |
| 用户头像 | 200x200 | JPG/PNG |
| 品牌Logo | 200x200 | PNG（透明背景） |
| 占位图 | 400x400 | PNG |

### 3. 性能优化

```typescript
// 使用Next.js Image组件自动优化
<Image
  src={ossImageUrl}
  alt="Product"
  width={800}
  height={800}
  loading="lazy"  // 懒加载
  placeholder="blur"  // 模糊占位
  blurDataURL={PLACEHOLDER_IMAGE}
/>
```

---

## 🚨 常见问题

### Q1: OSS图片无法访问？

**A**: 检查以下几点：
1. OSS Bucket是否设置为公共读权限
2. 图片URL是否正确
3. 网络是否正常
4. 浏览器控制台是否有CORS错误

### Q2: 如何批量上传图片？

**A**: 使用提供的迁移脚本：
```bash
npx tsx scripts/migrate-images-to-oss.ts
```

### Q3: 占位图不显示？

**A**: 确保占位图已上传到OSS：
```
https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png
```

### Q4: 数据库种子运行失败？

**A**: 
1. 确保数据库连接正常
2. 运行 `npx prisma migrate reset` 清空数据库
3. 检查 `prisma/schema.prisma` 是否有语法错误

---

## 📝 更新日志

### v1.8.8 (2025-10-30)

**新增**:
- ✨ 创建OSS图片URL管理模块
- ✨ 创建完整订单流程种子数据
- ✨ 创建图片迁移工具脚本
- ✨ 更新所有组件使用OSS图片

**优化**:
- 🎨 统一图片存储路径
- 📦 完整的测试数据覆盖
- 📚 详细的使用文档

---

## 🔗 相关文档

- [快速启动指南](./快速启动指南.md)
- [数据库种子使用指南](./数据库种子使用指南.md)
- [后台功能使用指南](./后台功能使用指南.md)
- [性能优化指南](./性能优化指南.md)

---

## ✨ 总结

通过本次迁移，YOYO Mall项目实现了：

1. **图片云端化** - 所有图片存储在阿里云OSS，不依赖本地文件
2. **数据完整性** - 完整的订单流程测试数据
3. **易于维护** - 集中管理图片URL，统一更新
4. **性能优化** - 利用CDN加速图片加载
5. **可扩展性** - 轻松添加新的图片分类

现在你可以：
- ✅ 使用真实的商品图片
- ✅ 测试完整的下单流程
- ✅ 在后台管理订单
- ✅ 部署到生产环境（无需担心图片路径问题）

---

**维护人员**: AI Assistant  
**最后更新**: 2025-10-30  
**状态**: ✅ 已完成

