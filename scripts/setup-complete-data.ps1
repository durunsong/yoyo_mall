# YOYO Mall 完整数据设置脚本 (PowerShell版本)
# 用于快速创建包含完整订单流程的测试数据

Write-Host "🚀 开始设置YOYO Mall完整测试数据..." -ForegroundColor Green
Write-Host ""

# 1. 检查环境
Write-Host "📋 检查环境..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ 错误: .env.local 文件不存在" -ForegroundColor Red
    Write-Host "请先复制 .env.example 到 .env.local 并配置数据库连接" -ForegroundColor Yellow
    exit 1
}

# 2. 安装依赖
Write-Host ""
Write-Host "📦 检查依赖..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    npm install
}

# 3. 生成Prisma Client
Write-Host ""
Write-Host "🔧 生成Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# 4. 重置数据库并运行迁移
Write-Host ""
Write-Host "🗄️  重置数据库..." -ForegroundColor Cyan
npx prisma migrate reset --force

# 5. 运行完整种子数据
Write-Host ""
Write-Host "🌱 创建完整测试数据..." -ForegroundColor Cyan
npx tsx prisma/seed-complete.ts

# 6. 完成
Write-Host ""
Write-Host "✅ 完整数据设置成功！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 测试账号:" -ForegroundColor Yellow
Write-Host "  管理员: admin@yoyomall.com / admin123456"
Write-Host "  用户1:  user1@example.com / password123"
Write-Host "  用户2:  user2@example.com / password123"
Write-Host "  用户3:  user3@example.com / password123"
Write-Host ""
Write-Host "🎯 下一步:" -ForegroundColor Yellow
Write-Host "  1. 启动开发服务器: npm run dev"
Write-Host "  2. 访问前台: http://localhost:3000"
Write-Host "  3. 访问后台: http://localhost:3000/admin"
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Cyan
Write-Host "  - 查看数据库: npm run db:studio"
Write-Host "  - 重新生成数据: npm run db:reset:complete"
Write-Host ""

