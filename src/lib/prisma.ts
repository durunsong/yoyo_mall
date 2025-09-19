/**
 * Prisma客户端配置
 * 用于数据库连接和查询操作
 */

import { PrismaClient } from '@prisma/client'

// 防止在开发环境中创建多个Prisma实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 创建Prisma客户端实例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// 在开发环境中保存实例到全局变量
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma
