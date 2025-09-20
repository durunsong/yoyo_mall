/**
 * 根提供者组件
 * 包装整个应用的全局提供者
 */

'use client';

import React from 'react';
import { AuthProvider } from './auth-provider';
import { Toaster } from '@/components/ui/sonner';

interface RootProvidersProps {
  children: React.ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}