# 修复Footer配置500错误

## 🚨 问题
访问 `/api/admin/footer-sections` 时出现500错误

## 🔍 原因
Prisma客户端还没有包含新的Footer配置模型

## ✅ 解决方案（按顺序执行）

### 步骤1: 停止开发服务器
按 `Ctrl + C` 停止当前运行的开发服务器

### 步骤2: 重新生成Prisma客户端
```bash
npx prisma generate
```

### 步骤3: 确认数据库同步
```bash
npx prisma db push
```

### 步骤4: 运行初始化数据脚本
```bash
node scripts/init-footer-config.js
```

应该看到：
```
🌱 开始创建Footer配置初始数据...
✅ Footer区块创建成功
✅ Footer链接创建成功
✅ Footer联系信息创建成功
✅ Footer社交媒体链接创建成功
✅ Footer配置初始数据创建完成!
```

### 步骤5: 重新启动开发服务器
```bash
npm run dev
```

### 步骤6: 验证
访问 http://localhost:3000/admin/footer-config

应该能看到：
- ✅ 左侧导航栏
- ✅ 顶部Header
- ✅ Footer配置管理页面
- ✅ Footer区块列表（如果已运行初始化脚本）

## 🐛 如果还有问题

### 检查控制台错误
打开浏览器开发者工具（F12），查看Console和Network标签的详细错误信息

### 检查数据库连接
确保 `.env` 文件中的 `DATABASE_URL` 配置正确

### 检查数据库表
```bash
npx prisma studio
```
查看数据库中是否有以下表：
- `footer_sections`
- `footer_links`
- `footer_contacts`
- `footer_socials`

## 📝 快速命令（一键执行）

```bash
# 停止服务器 (Ctrl+C)
# 然后执行：
npx prisma generate && npx prisma db push && node scripts/init-footer-config.js && npm run dev
```

## 🆘 替代方案

如果上述方法都不行，尝试：

```bash
# 清除缓存并重新安装
rm -rf .next node_modules/.prisma
npx prisma generate
npm run dev
```

## ✨ 成功标志

当一切正常时，你应该能：
1. 访问 `/admin/footer-config` 看到完整页面
2. 点击"添加区块"按钮
3. API返回200状态码
4. 看到初始化的4个区块（Company、Customer Service、My Account、Legal）

