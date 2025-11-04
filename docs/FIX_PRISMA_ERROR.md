# 修复 Prisma Client 错误

## 错误信息
```
"error": "Cannot read properties of undefined (reading 'findUnique')"
```

## 原因
数据库模型更新后，Prisma Client 没有重新生成，导致新的 `SystemSettings` 模型不可用。

## 解决方案

### 方法1：重启开发服务器（推荐）

1. **停止开发服务器**
   - 在运行 `pnpm dev` 的终端中按 `Ctrl+C`

2. **重新生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **重启开发服务器**
   ```bash
   pnpm dev
   ```

### 方法2：如果文件被锁定

如果看到 `EPERM: operation not permitted` 错误：

1. **完全停止所有 Node 进程**
   - Windows: 打开任务管理器，结束所有 `node.exe` 进程
   - Mac/Linux: `killall node`

2. **清理并重新生成**
   ```bash
   # 删除 node_modules/.prisma 目录
   rm -rf node_modules/.prisma

   # 重新生成
   npx prisma generate

   # 重启开发服务器
   pnpm dev
   ```

### 方法3：如果还是不行

```bash
# 1. 停止开发服务器
# 2. 重新安装依赖
pnpm install

# 3. 生成 Prisma Client
npx prisma generate

# 4. 推送数据库更改
npx prisma db push

# 5. 重启开发服务器
pnpm dev
```

## 验证修复

访问以下接口应该正常返回：
```
http://localhost:3000/api/admin/settings
```

应该返回类似：
```json
{
  "success": true,
  "data": {
    "id": "global",
    "siteName": "YoYo Mall",
    "defaultCurrency": "CNY",
    ...
  }
}
```

## 预防措施

每次修改 `prisma/schema.prisma` 后，都需要：

1. 运行 `npx prisma migrate dev` 或 `npx prisma db push`
2. 运行 `npx prisma generate`
3. 重启开发服务器

或者使用一条命令：
```bash
npx prisma migrate dev && pnpm dev
```

