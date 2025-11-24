/**
 * 购物车状态管理
 * 使用Zustand管理购物车状态
 * 注意：购物车数据不使用localStorage，必须登录后才能添加购物车
 * 未登录用户点击添加购物车会弹出登录框
 */

import { create } from 'zustand';
import type { CartItem } from '@/types';

// 购物车状态接口
interface CartState {
  // 状态
  items: CartItem[];
  coupon: {
    code: string;
    discount: number;
  } | null;
  isOpen: boolean;
  _hasHydrated: boolean; // 水合状态标记（始终为true，因为不使用localStorage）

  // 计算属性
  itemCount: number;
  subtotal: number;

  // 操作方法
  addItem: (item: Omit<CartItem, 'id'> & { id?: string }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (payload: { code: string; discount: number }) => void;
  clearCoupon: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setHasHydrated: (state: boolean) => void; // 设置水合状态
}

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 创建购物车store（不使用persist中间件）
export const useCartStore = create<CartState>((set, get) => ({
  // 初始状态
  items: [],
  coupon: null,
  isOpen: false,
  _hasHydrated: true, // 不使用localStorage，始终为true

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

      // 查找相同的商品（比较productId和variantId）
      // variantId为null/undefined时也要匹配
      const existingItem = state.items.find(item => {
        const sameProduct = item.productId === normalizedItem.productId;
        const sameVariant = 
          (item.variantId === normalizedItem.variantId) ||
          (!item.variantId && !normalizedItem.variantId);
        return sameProduct && sameVariant;
      });

      if (existingItem) {
        // 如果商品已存在，增加数量
        console.log(`🔄 商品已存在，合并数量: ${existingItem.name}, 原数量: ${existingItem.quantity}, 新增: ${normalizedItem.quantity}`);
        return {
          items: state.items.map(item =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + normalizedItem.quantity }
              : item,
          ),
        };
      } else {
      // 添加新商品，如果传入了id则使用传入的，否则生成新的
      const itemId = normalizedItem.id || generateId();
        console.log(`➕ 添加新商品: ${normalizedItem.name}, 数量: ${normalizedItem.quantity}, ID: ${itemId}`);
        return {
          items: [...state.items, { ...normalizedItem, id: itemId }],
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
      coupon: null,
    })),

  applyCoupon: payload =>
    set(() => ({
      coupon: payload,
    })),

  clearCoupon: () =>
    set(() => ({
      coupon: null,
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

  // 设置水合状态（兼容性保留，始终为true）
  setHasHydrated: (state) =>
    set(() => ({
      _hasHydrated: state,
    })),
}));
