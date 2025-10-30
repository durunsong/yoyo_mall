# 🎉 YOYO Mall - 完整数据快速开始

> 一键创建包含完整订单流程和OSS图片的测试数据

---

## ⚡ 快速开始（仅需2步）

### 步骤1: 配置环境

复制 `.env.example` 到 `.env.local` 并配置数据库：

```env
DATABASE_URL="your_database_url"
OSS_REGION="oss-cn-shanghai"
OSS_BUCKET="next-static-oss"
```

### 步骤2: 一键设置

```bash
npm run db:reset:complete
```

就这么简单！🎊

---

## 📊 你将获得什么

### 用户数据（4个）
- 1个管理员账号
- 3个测试用户账号

### 商品数据（9个）
- 4个数码产品（iPhone、MacBook、AirPods、Samsung）
- 3个服装配饰（Nike、Adidas、Zara）
- 2个家居产品（IKEA书架、椅子）

### 订单数据（6个）- **完整流程**
1. ✋ 待支付订单
2. ⏳ 处理中订单
3. 🚚 已发货订单（有物流单号）
4. 📦 已送达订单
5. ✅ 已完成订单
6. ❌ 已取消订单（已退款）

### 图片数据（全部OSS）
- ✅ 商品图片：`oss://next-static-oss/products/`
- ✅ 用户头像：`oss://next-static-oss/users/avatars/`
- ✅ 品牌Logo：`oss://next-static-oss/brands/`

---

## 🔑 测试账号

| 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|
| 管理员 | admin@yoyomall.com | admin123456 | 访问后台 |
| 用户1 | user1@example.com | password123 | 有2个订单 |
| 用户2 | user2@example.com | password123 | 有2个订单 |
| 用户3 | user3@example.com | password123 | 有2个订单 |

---

## 🚀 开始测试

### 1. 启动项目

```bash
npm run dev
```

### 2. 访问前台

打开浏览器访问 http://localhost:3000

- 浏览商品列表（查看OSS图片）
- 登录用户账号
- 查看"我的订单"
- 测试购物流程

### 3. 访问后台

访问 http://localhost:3000/admin

- 使用管理员账号登录
- 查看所有订单
- 更新订单状态
- 管理商品

---

## 📝 NPM命令

```bash
# 重置数据库并创建完整数据（推荐）
npm run db:reset:complete

# 仅运行种子数据（不重置数据库）
npm run db:seed:complete

# 查看数据库
npm run db:studio

# 迁移图片到OSS（可选）
npm run oss:migrate
```

---

## 🎯 核心特性

### ✅ 完整订单流程
覆盖订单从下单到完成/取消的所有状态，可以测试：
- 用户下单购物
- 支付流程
- 订单发货
- 物流跟踪
- 订单完成
- 订单取消/退款

### ✅ OSS云端图片
所有图片使用阿里云OSS，无需本地图片：
- 商品图片
- 用户头像
- 品牌Logo
- 占位图

### ✅ 真实数据关联
- 用户 → 订单 → 商品
- 商品 → 分类 → 品牌
- 订单 → 支付 → 物流
- 用户 → 地址 → 评论

---

## 📚 详细文档

想了解更多？查看这些文档：

- 📖 [完整数据和OSS图片迁移总结](./docs/完整数据和OSS图片迁移总结.md)
- 🚀 [快速设置完整数据](./docs/快速设置完整数据.md)
- 🎨 [OSS图片迁移指南](./docs/OSS图片迁移指南.md)
- 🔧 [数据库种子使用指南](./docs/数据库种子使用指南.md)

---

## 🤔 常见问题

### Q: 如何重新生成数据？

A: 运行 `npm run db:reset:complete` 即可

### Q: 图片不显示？

A: 检查OSS配置，确保Bucket有公共读权限

### Q: 能修改商品数据吗？

A: 可以！编辑 `prisma/seed-complete.ts` 文件

### Q: 如何添加更多订单？

A: 在 `prisma/seed-complete.ts` 的 `orderScenarios` 数组中添加

---

## 💡 开发提示

### 图片使用

```typescript
// 在组件中使用OSS图片
import { PLACEHOLDER_IMAGE, getRandomImage } from '@/lib/oss-images';

<Image 
  src={product.image || PLACEHOLDER_IMAGE} 
  alt={product.name}
/>
```

### 数据重置

```bash
# 每次需要干净的数据时
npm run db:reset:complete
```

### 查看数据

```bash
# 使用Prisma Studio可视化查看数据
npm run db:studio
```

---

## 🎊 就这些！

现在你有了一个**功能完整、数据完整、图片完整**的YOYO Mall项目！

开始你的开发之旅吧！🚀

---

**维护**: AI Assistant  
**版本**: v1.8.8  
**日期**: 2025-10-30

