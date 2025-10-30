/**
 * 购物车同步组件
 * 双向同步：
 * 1. 登录后从服务端恢复购物车
 * 2. 本地有商品时同步到服务端
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart-store';

export function CartSync() {
  const { data: session, status } = useSession();
  const { items, addItem, clearCart } = useCartStore();
  const [restored, setRestored] = useState(false);
  const syncedRef = useRef(false);

  // 步骤1: 登录后从服务端恢复购物车
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || restored) {
      return;
    }

    const restoreCartFromServer = async () => {
      try {
        console.log('🔄 从服务端恢复购物车...');

        const response = await fetch('/api/cart');
        const data = await response.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // 先清空本地购物车
          clearCart();

          // 从服务端恢复
          data.data.forEach((item: any) => {
            if (item.product) {
              addItem({
                productId: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.images?.[0]?.url || '',
                quantity: item.quantity,
                variantId: item.variantId || null,
              });
            }
          });

          console.log(`✅ 购物车恢复完成: ${data.data.length} 件商品`);
        }

        setRestored(true);
      } catch (error) {
        console.error('❌ 购物车恢复失败:', error);
        setRestored(true);
      }
    };

    restoreCartFromServer();
  }, [status, session?.user, restored, clearCart, addItem]);

  // 步骤2: 本地有商品时同步到服务端
  useEffect(() => {
    if (
      status !== 'authenticated' ||
      !session?.user ||
      !restored ||
      items.length === 0 ||
      syncedRef.current
    ) {
      return;
    }

    const syncCartToServer = async () => {
      try {
        console.log('📤 同步本地购物车到服务端...');

        const response = await fetch('/api/cart/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        });

        if (response.ok) {
          console.log('✅ 购物车同步完成');
          syncedRef.current = true;
        } else {
          console.error('❌ 购物车同步失败:', await response.text());
        }
      } catch (error) {
        console.error('❌ 购物车同步失败:', error);
      }
    };

    syncCartToServer();
  }, [status, session?.user, items, restored]);

  // 登出时重置状态
  useEffect(() => {
    if (status === 'unauthenticated') {
      setRestored(false);
      syncedRef.current = false;
    }
  }, [status]);

  // 不渲染任何UI
  return null;
}



