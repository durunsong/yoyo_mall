/**
 * Prisma客户端配置
 * 用于数据库连接和查询操作
 */

import { PrismaClient } from '@prisma/client';

// 防止在开发环境中创建多个Prisma实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建Prisma客户端实例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// 在开发环境中保存实例到全局变量
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 在 Edge/runtime 中 process 可能不可用，避免使用 process.on
if (typeof process !== 'undefined' && typeof (process as any).on === 'function') {
  (process as any).on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
