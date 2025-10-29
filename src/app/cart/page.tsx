/**
 * 购物车页面
 * 展示购物车商品列表、数量管理、价格计算、优惠券应用
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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

export default function CartPage() {
  const router = useRouter();
  const { t } = useStaticTranslations('cart');
  const { t: tCommon } = useStaticTranslations('common');
  
  const { items, updateQuantity, removeItem } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // 计算总价
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal >= 99 ? 0 : 10; // 满99免运费
  const tax = subtotal * 0.08; // 8%税率
  const discount = couponDiscount;
  const total = subtotal + shipping + tax - discount;

  // 应用优惠券
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t('enterCouponCode') || 'Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      // TODO: 调用优惠券验证API
      // 模拟优惠券验证
      if (couponCode.toUpperCase() === 'WELCOME10') {
        const discountAmount = subtotal * 0.1; // 10% 折扣
        setCouponDiscount(discountAmount);
        toast.success(t('couponApplied') || 'Coupon applied successfully!');
      } else {
        toast.error(t('invalidCoupon') || 'Invalid coupon code');
      }
    } catch (error) {
      toast.error(t('couponError') || 'Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // 移除优惠券
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    toast.success(t('couponRemoved') || 'Coupon removed');
  };

  // 更新数量
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      updateQuantity(itemId, newQuantity);
    } catch (error) {
      toast.error(t('updateFailed') || 'Failed to update quantity');
    }
  };

  // 删除商品
  const handleRemoveItem = (itemId: string) => {
    try {
      removeItem(itemId);
      toast.success(t('itemRemoved') || 'Item removed from cart');
    } catch (error) {
      toast.error(t('removeFailed') || 'Failed to remove item');
    }
  };

  // 结算
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error(t('emptyCart') || 'Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  // 空购物车状态
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
              {t('emptyCart') || 'Your cart is empty'}
            </h2>
            <p className="mb-6 text-gray-600">
              {t('emptyCartDesc') || 'Add some products to get started!'}
            </p>
            <Link href="/products">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t('continueShopping') || 'Continue Shopping'}
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
            {t('shoppingCart') || 'Shopping Cart'}
          </h1>
          <p className="text-gray-600">
            {items.length} {t('items') || 'items'} {t('inCart') || 'in your cart'}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：购物车商品列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {items.map((item) => (
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
                                  handleUpdateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
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
                                  handleUpdateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-blue-600">
                                ¥{(item.price * item.quantity).toFixed(2)}
                              </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>

            {/* 继续购物 */}
            <div className="mt-4">
              <Link href="/products">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  {t('continueShopping') || 'Continue Shopping'}
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
                    {t('coupon') || 'Coupon Code'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {couponDiscount > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          {couponCode}
                        </Badge>
                        <span className="text-sm text-green-700">
                          -${couponDiscount.toFixed(2)}
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
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={t('enterCouponCode') || 'Enter code'}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                      >
                        {t('apply') || 'Apply'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 订单摘要 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('orderSummary') || 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>{tCommon('subtotal') || 'Subtotal'}</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{tCommon('shipping') || 'Shipping'}</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{tCommon('tax') || 'Tax'}</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{tCommon('discount') || 'Discount'}</span>
                      <span>-${couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{tCommon('total') || 'Total'}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={items.length === 0}
                  >
                    {t('proceedToCheckout') || 'Proceed to Checkout'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-center text-xs text-gray-500">
                    {t('freeShippingNote') || 'Free shipping on orders over $99'}
                  </p>
                </CardContent>
              </Card>

              {/* 安全提示 */}
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                🔒 {t('secureCheckout') || 'Secure checkout with SSL encryption'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
