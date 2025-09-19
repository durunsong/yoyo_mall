/**
 * 用户认证状态管理
 * 使用Zustand管理用户登录状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@prisma/client';

// 用户信息接口
interface UserInfo extends Omit<User, 'password'> {
  // 排除敏感信息，只保留前端需要的用户数据
}

// 认证状态接口
interface AuthState {
  // 状态
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // 操作方法
  setUser: (user: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: UserInfo) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserInfo>) => void;
}

// 创建认证store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isLoading: false,
      
      // 计算属性
      get isAuthenticated() {
        return !!get().user;
      },
      
      // 设置用户信息
      setUser: (user) =>
        set(() => ({
          user,
        })),
      
      // 设置加载状态
      setLoading: (loading) =>
        set(() => ({
          isLoading: loading,
        })),
      
      // 用户登录
      login: (user) =>
        set(() => ({
          user,
          isLoading: false,
        })),
      
      // 用户登出
      logout: () =>
        set(() => ({
          user: null,
          isLoading: false,
        })),
      
      // 更新用户资料
      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化用户信息，加载状态不持久化
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);
