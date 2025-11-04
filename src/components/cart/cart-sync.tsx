/**
 * 购物车同步组件
 * 功能：登录后从服务端恢复购物车数据
 * 注意：不再使用localStorage，未登录用户无法添加购物车
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart-store';

export function CartSync() {
  const { data: session, status } = useSession();
  const { addItem, clearCart } = useCartStore();
  const [restored, setRestored] = useState(false);

  // 登录后从服务端恢复购物车
  useEffect(() => {
    // 只在认证完成且未恢复时执行
    if (status !== 'authenticated' || !session?.user || restored) {
      return;
    }

    const restoreCartFromServer = async () => {
      try {
        console.log('🔄 从服务端恢复购物车...');

        const response = await fetch('/api/cart');
        const result = await response.json();

        if (result.success && result.data?.items && Array.isArray(result.data.items) && result.data.items.length > 0) {
          // 先清空本地购物车
          clearCart();

          // 从服务端恢复，确保数据类型正确
          result.data.items.forEach((item: any) => {
            if (item.product) {
              addItem({
                id: item.id, // 🔥 保存服务器返回的购物车项ID
                productId: item.productId,
                name: item.product.name,
                price: Number(item.price || 0),
                image: item.product.image || (item.product.images?.[0]?.url || ''),
                quantity: Number(item.quantity || 1),
                variantId: item.variantId || null,
                attributes: item.variant?.attributes || undefined,
              });
            }
          });

          console.log(`✅ 购物车恢复完成: ${result.data.items.length} 件商品`);
        } else {
          console.log('ℹ️ 服务端购物车为空');
        }

        setRestored(true);
      } catch (error) {
        console.error('❌ 购物车恢复失败:', error);
        setRestored(true);
      }
    };

    restoreCartFromServer();
  }, [status, session?.user, restored, clearCart, addItem]);

  // 登出时清空购物车和重置状态
  useEffect(() => {
    if (status === 'unauthenticated') {
      clearCart();
      setRestored(false);
    }
  }, [status, clearCart]);

  // 不渲染任何UI
  return null;
}



