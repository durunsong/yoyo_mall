/**
 * NextAuth v5 认证工具函数
 * 在 NextAuth v5 中，使用 auth() 替代 getServerSession()
 */

import { auth as nextAuth } from '@/app/api/auth/[...nextauth]/route';

/**
 * 获取当前会话
 * 在 NextAuth v5 中，使用这个函数替代 getServerSession
 */
export const auth = nextAuth;

// 为了兼容性，也导出一个 getServerSession 别名
export const getServerSession = nextAuth;

