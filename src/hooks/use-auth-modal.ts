/**
 * 认证弹窗状态管理Hook
 */

'use client';

import { create } from 'zustand';

export type AuthModalTab = 'login' | 'register';

interface UseAuthModalReturn {
  isOpen: boolean;
  defaultTab: AuthModalTab;
  openModal: (tab?: AuthModalTab) => void;
  closeModal: () => void;
  switchTab: (tab: AuthModalTab) => void;
}

const useAuthModalStore = create<UseAuthModalReturn>((set) => ({
  // 记录弹窗是否打开
  isOpen: false,
  // 记录当前默认页签，支持登录与注册两种
  defaultTab: 'login',
  // 打开弹窗时可以指定页签
  openModal: (tab: AuthModalTab = 'login') =>
    set({ isOpen: true, defaultTab: tab }),
  // 关闭弹窗
  closeModal: () => set({ isOpen: false }),
  // 在弹窗内部切换页签时更新默认值
  switchTab: (tab: AuthModalTab) => set({ defaultTab: tab }),
}));

export const useAuthModal = (): UseAuthModalReturn => useAuthModalStore();
