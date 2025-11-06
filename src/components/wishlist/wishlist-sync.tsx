/**
 * 心愿单同步组件
 * 登录后自动同步服务端心愿单数据到本地store
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWishlistStore } from '@/store/wishlist-store';

export function WishlistSync() {
  const { data: session, status } = useSession();
  const wishlistStore = useWishlistStore();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // 只在登录状态且未同步时执行
    if (status !== 'authenticated' || !session?.user || synced) {
      return;
    }

    const syncWishlistFromServer = async () => {
      try {
        console.log('🔄 开始同步心愿单...');

        // 从服务端获取心愿单
        const response = await fetch('/api/wishlist');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // 清空本地心愿单
          wishlistStore.clearWishlist();

          // 从服务端恢复心愿单
          data.data.forEach((item: any) => {
            if (item.product) {
              wishlistStore.addItem({
                id: item.id,
                productId: item.product.id,
                name: item.product.name,
                price: Number(item.product.price ?? 0),
                image: item.product.images?.[0]?.url || '',
                addedAt: item.createdAt ? new Date(item.createdAt) : undefined,
              });
            }
          });

          console.log(`✅ 心愿单同步完成: ${data.data.length} 件商品`);
          setSynced(true);
        }
      } catch (error) {
        console.error('❌ 心愿单同步失败:', error);
      }
    };

    syncWishlistFromServer();
  }, [status, session?.user, synced, wishlistStore]);

  // 不渲染任何UI
  return null;
}

