/**
 * 心愿单状态管理
 * 使用Zustand管理心愿单状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 心愿单商品接口
interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: Date;
}

// 心愿单状态接口
interface WishlistState {
  // 状态
  items: WishlistItem[];

  // 计算属性
  itemCount: number;

  // 操作方法
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 创建心愿单store
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      // 初始状态
      items: [],

      // 计算属性
      get itemCount() {
        return get().items.length;
      },

      // 添加商品到心愿单
      addItem: newItem =>
        set(state => {
          const existingItem = state.items.find(
            item => item.productId === newItem.productId,
          );

          if (existingItem) {
            // 如果商品已存在,不重复添加
            return state;
          } else {
            // 添加新商品
            return {
              items: [
                ...state.items,
                {
                  ...newItem,
                  id: generateId(),
                  addedAt: new Date(),
                },
              ],
            };
          }
        }),

      // 移除商品
      removeItem: itemId =>
        set(state => ({
          items: state.items.filter(item => item.id !== itemId),
        })),

      // 清空心愿单
      clearWishlist: () =>
        set(() => ({
          items: [],
        })),

      // 检查商品是否在心愿单中
      isInWishlist: productId => {
        return get().items.some(item => item.productId === productId);
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化items
      partialize: state => ({
        items: state.items,
      }),
    },
  ),
);



