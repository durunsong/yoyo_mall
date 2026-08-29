/**
 * 根提供者组件
 * 包装整个应用的全局提供者
 */

'use client';

import React from 'react';
import { AuthProvider } from './auth-provider';
import { Toaster } from '@/components/ui/sonner';
import { CartSync } from '@/components/cart/cart-sync';
import { WishlistSync } from '@/components/wishlist/wishlist-sync';
import { TawkToWidget } from '@/components/chat/tawk-to-widget';

interface RootProvidersProps {
  children: React.ReactNode;
  authEnabled: boolean;
}

export function RootProviders({ children, authEnabled }: RootProvidersProps) {
  return (
    <AuthProvider authEnabled={authEnabled}>
      {children}
      <Toaster position="top-right" richColors closeButton />
      {/* 购物车数据同步 */}
      <CartSync />
      {/* 心愿单数据同步 */}
      <WishlistSync />
      {/* Tawk.to 在线客服 */}
      <TawkToWidget />
    </AuthProvider>
  );
}
