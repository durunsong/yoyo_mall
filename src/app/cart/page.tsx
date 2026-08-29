/**
 * 购物车页面
 * 展示购物车商品列表、数量管理、价格计算、优惠券应用
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  X,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';
import {
  calculateShippingAmount,
  calculateTaxAmount,
  calculateCheckoutTotals,
  SHIPPING_FREE_THRESHOLD,
} from '@/lib/pricing';

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useStaticTranslations('cart');
  const { t: tCommon } = useStaticTranslations('common');
  const { t: tProduct } = useStaticTranslations('product');
  
  const {
    items,
    updateQuantity,
    removeItem,
    _hasHydrated,
    coupon,
    applyCoupon,
    clearCoupon,
  } = useCartStore();
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (coupon?.code) {
      setCouponInput(coupon.code);
    } else {
      setCouponInput('');
    }
  }, [coupon]);

  // 获取系统设置的货币符号
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);

  // 计算总价
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingThreshold = SHIPPING_FREE_THRESHOLD;
  const shipping = calculateShippingAmount(subtotal);
  const tax = calculateTaxAmount(subtotal);
  const { discount, total } = calculateCheckoutTotals({
    subtotal,
    shipping,
    tax,
    discount: coupon?.discount,
  });

  // 应用优惠券
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error(t('enterCouponCode'));
      return;
    }

    if (!session?.user) {
      toast.error(tProduct('toast.loginRequired'));
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t('invalidCoupon'));
      }

      applyCoupon({
        code: data.data.coupon.code,
        discount: data.data.discountAmount,
      });
      setCouponInput(data.data.coupon.code);
      toast.success(t('couponApplied'));
    } catch (error) {
      console.error('验证优惠券失败:', error);
      toast.error(
        error instanceof Error ? error.message : t('couponError'),
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  // 移除优惠券
  const handleRemoveCoupon = () => {
    setCouponInput('');
    clearCoupon();
    toast.success(t('couponRemoved'));
  };

  // 更新数量
  const handleUpdateQuantity = async (itemId: string, productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    if (!session?.user) {
      toast.error(tProduct('toast.loginRequired'));
      return;
    }

    // 标记为正在更新
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t('updateFailed'));
      }

      // 更新本地store
      updateQuantity(itemId, newQuantity);
      
      if (newQuantity === 0) {
        toast.success(t('itemRemoved'));
      }
    } catch (error) {
      console.error('更新购物车失败:', error);
      toast.error(error instanceof Error ? error.message : t('updateFailed'));
    } finally {
      // 移除更新标记
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // 删除商品
  const handleRemoveItem = async (itemId: string, productName: string) => {
    if (!session?.user) {
      toast.error(tProduct('toast.loginRequired'));
      return;
    }

    // 标记为正在更新
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t('removeFailed'));
      }

      // 更新本地store
      removeItem(itemId);
      toast.success(t('itemRemoved'));
    } catch (error) {
      console.error('删除购物车商品失败:', error);
      toast.error(error instanceof Error ? error.message : t('removeFailed'));
    } finally {
      // 移除更新标记
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // 结算
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error(t('empty'));
      return;
    }
    router.push('/checkout');
  };

  // 空购物车状态 - 等待水合完成后再判断
  if (!_hasHydrated) {
    // 显示加载状态
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gray-100 p-6">
                <ShoppingCart className="h-16 w-16 text-gray-400 animate-pulse" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {t('loading')}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gray-100 p-6">
                <ShoppingCart className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {t('empty')}
            </h2>
            <p className="mb-6 text-gray-600">
              {t('emptyCartDesc')}
            </p>
            <Link href="/products">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t('continueShopping')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t('shoppingCart')}
          </h1>
          <p className="text-gray-600">
            {t('itemsCount', { count: items.length })}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：购物车商品列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {items.map((item) => {
                    const isUpdating = updatingItems.has(item.id);
                    
                    return (
                      <div key={item.id}>
                        <div className="flex gap-4">
                          {/* 商品图片 */}
                          <Link
                            href={`/products/${item.productId}`}
                            className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100"
                          >
                            <Image
                              src={item.image || 'https://via.placeholder.com/96'}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </Link>

                          {/* 商品信息 */}
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <Link
                                href={`/products/${item.productId}`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {item.name}
                              </Link>
                              {item.attributes && item.attributes.length > 0 && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {item.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')}
                                </p>
                              )}
                            </div>

                            {/* 价格和数量 */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleUpdateQuantity(item.id, item.productId, item.quantity - 1)
                                  }
                                  disabled={isUpdating || item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleUpdateQuantity(item.id, item.productId, item.quantity + 1)
                                  }
                                  disabled={isUpdating}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="text-lg font-bold text-blue-600">
                                  {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleRemoveItem(item.id, item.name)}
                                  disabled={isUpdating}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 继续购物 */}
            <div className="mt-4">
              <Link href="/products">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  {t('continueShopping')}
                </Button>
              </Link>
            </div>
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* 优惠券 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="h-5 w-5" />
                    {t('coupon')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          {coupon.code}
                        </Badge>
                        <span className="text-sm text-green-700">
                          -{currencySymbol}{coupon.discount.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleRemoveCoupon}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder={t('enterCouponCode')}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponInput.trim()}
                      >
                        {t('apply')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 订单摘要 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('orderSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>{tCommon('subtotal')}</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{tCommon('shipping')}</span>
                    <span>{shipping === 0 ? t('freeLabel') : `${currencySymbol}${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{tCommon('tax')}</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('couponDiscount')}</span>
                      <span>-{currencySymbol}{coupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{tCommon('total')}</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={items.length === 0}
                  >
                    {t('proceedToCheckout')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-center text-xs text-gray-500">
                    {t('freeShippingNote', { amount: `${currencySymbol}${shippingThreshold}` })}
                  </p>
                </CardContent>
              </Card>

              {/* 安全提示 */}
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                🔒 {t('secureCheckout')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
