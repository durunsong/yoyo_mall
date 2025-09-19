/**
 * 认证弹窗状态管理Hook
 */

'use client';

import { useState, useCallback } from 'react';

export type AuthModalTab = 'login' | 'register';

interface UseAuthModalReturn {
  isOpen: boolean;
  defaultTab: AuthModalTab;
  openModal: (tab?: AuthModalTab) => void;
  closeModal: () => void;
  switchTab: (tab: AuthModalTab) => void;
}

export function useAuthModal(): UseAuthModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<AuthModalTab>('login');

  const openModal = useCallback((tab: AuthModalTab = 'login') => {
    setDefaultTab(tab);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const switchTab = useCallback((tab: AuthModalTab) => {
    setDefaultTab(tab);
  }, []);

  return {
    isOpen,
    defaultTab,
    openModal,
    closeModal,
    switchTab
  };
}
