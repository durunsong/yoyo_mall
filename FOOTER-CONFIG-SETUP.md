# Footer配置系统 - 快速设置指南

## ⚠️ 重要：修复构建错误

如果遇到 `Export authOptions doesn't exist` 或 Prisma类型错误，请按以下步骤操作：

## 🔧 修复步骤

### 1. 停止开发服务器

按 `Ctrl + C` 停止当前运行的开发服务器。

### 2. 重新生成Prisma客户端

```bash
# Windows上如果遇到权限问题，先关闭开发服务器
npx prisma generate
```

如果仍然遇到权限错误，尝试：

```bash
# 方法1：删除并重新安装
rm -rf node_modules/.prisma
npx prisma generate

# 方法2：使用db push（会自动生成客户端）
npx prisma db push
```

### 3. 清除Next.js缓存

```bash
# 删除.next文件夹
rm -rf .next

# Windows PowerShell使用:
Remove-Item -Recurse -Force .next
```

### 4. 重新启动开发服务器

```bash
npm run dev
# 或
pnpm dev
# 或  
yarn dev
```

## ✅ 验证安装

访问以下URL验证功能：

1. **后台管理页面**
   ```
   http://localhost:3000/admin/footer-config
   ```
   
2. **API端点测试**
   ```
   http://localhost:3000/api/footer-config
   ```

3. **前端Footer**
   - 刷新任何页面
   - 查看底部Footer是否正常显示

## 🐛 常见问题

### 问题1: Prisma类型错误

**错误信息：**
```
Property 'footerSection' does not exist on type 'PrismaClient'
```

**解决方法：**
```bash
# 停止开发服务器
# 运行
npx prisma generate
# 重启开发服务器
```

### 问题2: authOptions导入错误

**错误信息：**
```
Export authOptions doesn't exist in target module
```

**解决方法：**
已修复！所有API路由现在使用NextAuth v5的`auth()`函数。

如果仍有问题，确保：
```bash
# 清除缓存
rm -rf .next
npm run dev
```

### 问题3: 数据库表不存在

**错误信息：**
```
Table 'footer_sections' doesn't exist
```

**解决方法：**
```bash
# 同步数据库schema
npx prisma db push

# 初始化数据
node scripts/init-footer-config.js
```

## 📚 完整文档

详细使用文档请查看：
```
docs/Footer配置管理系统-使用文档.md
```

## 🎯 快速测试

运行初始化脚本创建测试数据：

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

## 💡 提示

- 所有API路由已更新为NextAuth v5兼容
- 数据库schema已包含所有Footer配置表
- 初始数据脚本可以重复运行（使用upsert）
- 前端Footer组件会自动从API读取配置

## 🆘 需要帮助？

如果以上步骤都无法解决问题：

1. 检查Node.js版本（需要18.17或更高）
2. 检查数据库连接（DATABASE_URL环境变量）
3. 查看完整错误日志
4. 确保所有依赖已安装（`npm install`）

