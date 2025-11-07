#!/bin/bash

# Yobuy 完整数据设置脚本
# 用于快速创建包含完整订单流程的测试数据

echo "🚀 开始设置Yobuy完整测试数据..."
echo ""

# 1. 检查环境
echo "📋 检查环境..."
if [ ! -f ".env.local" ]; then
    echo "❌ 错误: .env.local 文件不存在"
    echo "请先复制 .env.example 到 .env.local 并配置数据库连接"
    exit 1
fi

# 2. 安装依赖
echo ""
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 3. 生成Prisma Client
echo ""
echo "🔧 生成Prisma Client..."
npx prisma generate

# 4. 重置数据库并运行迁移
echo ""
echo "🗄️  重置数据库..."
npx prisma migrate reset --force

# 5. 运行完整种子数据
echo ""
echo "🌱 创建完整测试数据..."
npx tsx prisma/seed-complete.ts

# 6. 完成
echo ""
echo "✅ 完整数据设置成功！"
echo ""
echo "📝 测试账号:"
echo "  管理员: admin@yoyomall.com / admin123456"
echo "  用户1:  user1@example.com / password123"
echo "  用户2:  user2@example.com / password123"
echo "  用户3:  user3@example.com / password123"
echo ""
echo "🎯 下一步:"
echo "  1. 启动开发服务器: npm run dev"
echo "  2. 访问前台: http://localhost:3000"
echo "  3. 访问后台: http://localhost:3000/admin"
echo ""
echo "💡 提示:"
echo "  - 查看数据库: npm run db:studio"
echo "  - 重新生成数据: npm run db:reset:complete"
echo ""

