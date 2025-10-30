/**
 * 购物车状态管理
 * 使用Zustand管理购物车状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/types';

// 购物车状态接口
interface CartState {
  // 状态
  items: CartItem[];
  isOpen: boolean;

  // 计算属性
  itemCount: number;
  subtotal: number;

  // 操作方法
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 创建购物车store
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // 初始状态
      items: [],
      isOpen: false,

      // 计算属性
      get itemCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      // 添加商品到购物车
      addItem: newItem =>
        set(state => {
          // 确保price是数字类型
          const normalizedItem = {
            ...newItem,
            price: Number(newItem.price || 0),
            quantity: Number(newItem.quantity || 1),
          };

          const existingItem = state.items.find(
            item =>
              item.productId === normalizedItem.productId &&
              item.variantId === normalizedItem.variantId,
          );

          if (existingItem) {
            // 如果商品已存在，增加数量
            return {
              items: state.items.map(item =>
                item.id === existingItem.id
                  ? { ...item, quantity: item.quantity + normalizedItem.quantity }
                  : item,
              ),
            };
          } else {
            // 添加新商品
            return {
              items: [...state.items, { ...normalizedItem, id: generateId() }],
            };
          }
        }),

      // 移除商品
      removeItem: itemId =>
        set(state => ({
          items: state.items.filter(item => item.id !== itemId),
        })),

      // 更新商品数量
      updateQuantity: (itemId, quantity) =>
        set(state => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(item => item.id !== itemId),
            };
          }

          return {
            items: state.items.map(item =>
              item.id === itemId ? { ...item, quantity } : item,
            ),
          };
        }),

      // 清空购物车
      clearCart: () =>
        set(() => ({
          items: [],
        })),

      // 切换购物车显示状态
      toggleCart: () =>
        set(state => ({
          isOpen: !state.isOpen,
        })),

      // 打开购物车
      openCart: () =>
        set(() => ({
          isOpen: true,
        })),

      // 关闭购物车
      closeCart: () =>
        set(() => ({
          isOpen: false,
        })),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化items，其他状态重新计算
      partialize: state => ({
        items: state.items,
      }),
      // 从localStorage恢复时，确保数据格式正确
      onRehydrateStorage: () => (state) => {
        if (state?.items) {
          // 确保所有price和quantity都是数字类型
          state.items = state.items.map(item => ({
            ...item,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
          }));
        }
      },
    },
  ),
);
