#!/bin/bash

echo "🔄 停止开发服务器..."
echo "请在运行 'pnpm dev' 的终端按 Ctrl+C"
echo ""
echo "按 Enter 继续..."
read

echo ""
echo "🧹 清理旧的 Prisma Client..."
rm -rf node_modules/.prisma

echo "🔨 重新生成 Prisma Client..."
npx prisma generate

echo ""
echo "✅ 完成！现在可以重启开发服务器了："
echo "   pnpm dev"

