# 重新生成 Prisma Client
Write-Host "停止开发服务器..." -ForegroundColor Yellow
Write-Host "请在运行 'pnpm dev' 的终端按 Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "清理旧的 Prisma Client..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "重新生成 Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host ""
Write-Host "✅ 完成！现在可以重启开发服务器了：" -ForegroundColor Green
Write-Host "   pnpm dev" -ForegroundColor Cyan

