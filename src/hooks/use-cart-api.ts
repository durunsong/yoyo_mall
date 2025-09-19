/**
 * 购物车API相关的自定义Hooks
 * 与后端购物车API集成
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useSession } from 'next-auth/react';

// 购物车项目类型
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image?: string;
    status: string;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
    attributes: Array<{
      name: string;
      value: string;
    }>;
  };
  availableQuantity: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

// 购物车汇总信息
export interface CartSummary {
  totalItems: number;
  subtotal: number;
  itemCount: number;
}

// 购物车数据
export interface CartData {
  items: CartItem[];
  summary: CartSummary;
}

// API响应类型
interface CartResponse {
  success: boolean;
  data: CartData;
  message?: string;
}

interface CartActionResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// 购物车API Hook
export function useCartApi() {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取购物车内容
  const fetchCart = useCallback(async () => {
    if (status === 'loading') return;
    if (!session?.user) {
      setCart(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cart');
      const result: CartResponse = await response.json();

      if (result.success) {
        setCart(result.data);
      } else {
        setError(result.message || '获取购物车失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // 添加商品到购物车
  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    variantId?: string
  ) => {
    if (!session?.user) {
      message.warning('请先登录');
      return false;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
          variantId,
        }),
      });

      const result: CartActionResponse = await response.json();

      if (result.success) {
        message.success('已添加到购物车');
        fetchCart(); // 刷新购物车
        return true;
      } else {
        message.error(result.message || '添加失败');
        return false;
      }
    } catch (error) {
      message.error('网络错误，请重试');
      return false;
    }
  }, [session, fetchCart]);

  // 更新购物车项目数量
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const result: CartActionResponse = await response.json();

      if (result.success) {
        if (quantity === 0) {
          message.success('已从购物车移除');
        }
        fetchCart(); // 刷新购物车
        return true;
      } else {
        message.error(result.message || '更新失败');
        return false;
      }
    } catch (error) {
      message.error('网络错误，请重试');
      return false;
    }
  }, [fetchCart]);

  // 删除购物车项目
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const result: CartActionResponse = await response.json();

      if (result.success) {
        message.success('已从购物车移除');
        fetchCart(); // 刷新购物车
        return true;
      } else {
        message.error(result.message || '删除失败');
        return false;
      }
    } catch (error) {
      message.error('网络错误，请重试');
      return false;
    }
  }, [fetchCart]);

  // 清空购物车
  const clearCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const result: CartActionResponse = await response.json();

      if (result.success) {
        message.success('购物车已清空');
        fetchCart(); // 刷新购物车
        return true;
      } else {
        message.error(result.message || '清空失败');
        return false;
      }
    } catch (error) {
      message.error('网络错误，请重试');
      return false;
    }
  }, [fetchCart]);

  // 初始化获取购物车
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
}

// 购物车项目数量Hook（用于显示徽章）
export function useCartCount() {
  const { cart } = useCartApi();
  return cart?.summary.totalItems || 0;
}

// 检查商品是否在购物车中
export function useIsInCart(productId: string, variantId?: string) {
  const { cart } = useCartApi();
  
  if (!cart) return false;
  
  return cart.items.some(item => 
    item.productId === productId && 
    (variantId ? item.variantId === variantId : !item.variantId)
  );
}

// 获取商品在购物车中的数量
export function useCartItemQuantity(productId: string, variantId?: string) {
  const { cart } = useCartApi();
  
  if (!cart) return 0;
  
  const item = cart.items.find(item => 
    item.productId === productId && 
    (variantId ? item.variantId === variantId : !item.variantId)
  );
  
  return item?.quantity || 0;
}
