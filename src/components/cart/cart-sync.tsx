/**
 * 购物车同步组件
 * 在用户登录后自动同步本地购物车数据到服务器
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

export function CartSync() {
  const { data: session, status } = useSession();
  const { items } = useCartStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    // 如果用户已登录且购物车有商品,且尚未同步
    if (status === 'authenticated' && session?.user && items.length > 0 && !syncedRef.current) {
      syncCartToServer();
      syncedRef.current = true;
    }

    // 如果用户登出,重置同步状态
    if (status === 'unauthenticated') {
      syncedRef.current = false;
    }
  }, [status, session, items]);

  const syncCartToServer = async () => {
    try {
      // 将本地购物车数据同步到服务器
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        console.log('购物车数据已同步到服务器');
      } else {
        console.error('购物车同步失败:', await response.text());
      }
    } catch (error) {
      console.error('购物车同步失败:', error);
    }
  };

  // 这个组件不渲染任何内容
  return null;
}



