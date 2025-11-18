/**
 * 结算页面
 * 完整的订单结算流程：地址选择 → 支付方式 → 订单确认 → 支付
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  CreditCard,
  MapPin,
  Check,
  ChevronRight,
  Lock,
  Package,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { useCartStore } from '@/store/cart-store';
import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  calculateShippingAmount,
  calculateTaxAmount,
  SHIPPING_FREE_THRESHOLD,
} from '@/lib/pricing';

// Stripe Promise
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
    '',
);

// 结算步骤枚举
enum CheckoutStep {
  SHIPPING = 'shipping',
  PAYMENT = 'payment',
  REVIEW = 'review',
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useStaticTranslations('checkout');
  const { data: session, status } = useSession();
  const {
    items,
    clearCart,
    coupon: appliedCoupon,
    clearCoupon,
  } = useCartStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.SHIPPING);
  const [clientSecret, setClientSecret] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    id: string;
    orderNumber: string;
  } | null>(null);
  
  // 配送地址
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });

  const fieldLabels = useMemo(
    () => ({
      firstName: t('fields.firstName'),
      lastName: t('fields.lastName'),
      email: t('fields.email'),
      phone: t('fields.phone'),
      address: t('fields.address'),
      city: t('fields.city'),
      state: t('fields.state'),
      postalCode: t('fields.postalCode'),
    }),
    [t],
  );
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);

  const ensureShippingAddressId = async () => {
    if (shippingAddressId) {
      return shippingAddressId;
    }

    if (!session?.user) {
      throw new Error(t('toast.loginRequired'));
    }

    const normalize = (value?: string | null) =>
      (value || '').trim().toLowerCase();

    setSavingAddress(true);
    try {
      let matchedId: string | null = null;

      const existingRes = await fetch('/api/user/addresses');
      if (existingRes.ok) {
        const existingData = await existingRes.json();
        const existingList: any[] = existingData.data || [];
        const matched = existingList.find(address =>
          normalize(address.firstName) === normalize(shippingAddress.firstName) &&
          normalize(address.lastName) === normalize(shippingAddress.lastName) &&
          normalize(address.addressLine1) === normalize(shippingAddress.address) &&
          normalize(address.city) === normalize(shippingAddress.city) &&
          normalize(address.state) === normalize(shippingAddress.state) &&
          normalize(address.postalCode) === normalize(shippingAddress.postalCode) &&
          normalize(address.country) === normalize(shippingAddress.country),
        );

        if (matched) {
          matchedId = matched.id;
          if (!matched.isDefault) {
            await fetch(`/api/user/addresses/${matched.id}/set-default`, {
              method: 'POST',
            });
          }
        }
      }

      if (matchedId) {
        setShippingAddressId(matchedId);
        return matchedId;
      }

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SHIPPING',
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          addressLine1: shippingAddress.address,
          addressLine2: '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '保存地址失败，请稍后重试');
      }

      const newId = data.data.id as string;
      setShippingAddressId(newId);
      await fetch(`/api/user/addresses/${newId}/set-default`, { method: 'POST' });

      return newId;
    } finally {
      setSavingAddress(false);
    }
  };

  // 计算总价
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = calculateShippingAmount(subtotal);
  const tax = calculateTaxAmount(subtotal);
  const total = subtotal + shipping + tax;

  // 验证地址
  const validateAddress = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
    for (const field of required) {
      if (!shippingAddress[field as keyof typeof shippingAddress]) {
        const label = fieldLabels[field as keyof typeof fieldLabels] || field;
        toast.error(t('validation.missingField', { field: label }));
        return false;
      }
    }
    return true;
  };

  // 进入支付步骤
  const handleProceedToPayment = async () => {
    if (!validateAddress()) return;

    if (!session?.user) {
      toast.error(t('toast.loginRequired'));
      router.push('/cart');
      return;
    }

    try {
      await ensureShippingAddressId();
      // 创建支付意图
      const response = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100), // 转换为分
          currency: 'usd',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setClientSecret(data.clientSecret);
        setCurrentStep(CheckoutStep.PAYMENT);
      } else {
        toast.error(t('toast.createPaymentFailed'));
      }
    } catch (error) {
      console.error('Payment intent error:', error);
      toast.error(
        error instanceof Error ? error.message : t('toast.paymentInitFailed'),
      );
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setCreatingOrder(true);
      const ensuredAddressId = await ensureShippingAddressId();

      const cartResponse = await fetch('/api/cart');
      const cartData = await cartResponse.json();

      if (!cartResponse.ok || !cartData.success || !cartData.data?.items?.length) {
        throw new Error(t('toast.cartEmpty'));
      }

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartData.data.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            quantity: item.quantity,
            unitPrice: Number(item.price),
          })),
          shippingAddressId: ensuredAddressId,
          paymentMethod: 'CREDIT_CARD',
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.message || t('toast.orderFailed'));
      }

      setOrderResult(orderResult.data);
      setCurrentStep(CheckoutStep.REVIEW);
      clearCart();
      clearCoupon();
      await fetch('/api/cart', { method: 'DELETE' });
    } catch (error) {
      console.error('创建订单失败:', error);
      const message =
        error instanceof Error ? error.message : t('toast.orderFailed');
      toast.error(message);
      const handledError =
        error instanceof Error ? error : new Error(message);
      (handledError as any).__handled = true;
      throw handledError;
    } finally {
      setCreatingOrder(false);
    }
  };

  // 如果购物车为空，跳转回购物车
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error(t('toast.loginRequired'));
      router.push('/cart');
    }
  }, [status, router, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题和步骤指示器 */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            {t('pageTitle')}
          </h1>
          
          {/* 步骤指示器 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep === CheckoutStep.SHIPPING
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {currentStep === CheckoutStep.SHIPPING ? '1' : <Check className="h-5 w-5" />}
              </div>
              <span className="ml-2 font-medium">{t('steps.shipping')}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep === CheckoutStep.PAYMENT
                    ? 'bg-blue-600 text-white'
                    : currentStep === CheckoutStep.REVIEW
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep === CheckoutStep.REVIEW ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <span className={`ml-2 ${currentStep === CheckoutStep.SHIPPING ? 'text-gray-400' : 'font-medium'}`}>
                {t('steps.payment')}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep === CheckoutStep.REVIEW
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
              <span className={`ml-2 ${currentStep === CheckoutStep.REVIEW ? 'font-medium' : 'text-gray-400'}`}>
                {t('steps.review')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：表单区域 */}
          <div className="lg:col-span-2">
            {/* 配送信息 */}
            {currentStep === CheckoutStep.SHIPPING && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('shipping.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">{`${t('fields.firstName')} *`}</Label>
                      <Input
                        id="firstName"
                        value={shippingAddress.firstName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{`${t('fields.lastName')} *`}</Label>
                      <Input
                        id="lastName"
                        value={shippingAddress.lastName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email">{`${t('fields.email')} *`}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{`${t('fields.phone')} *`}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">{`${t('fields.address')} *`}</Label>
                    <Input
                      id="address"
                      value={shippingAddress.address}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, address: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="city">{`${t('fields.city')} *`}</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">{`${t('fields.state')} *`}</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">{`${t('fields.postalCode')} *`}</Label>
                      <Input
                        id="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleProceedToPayment}
                    disabled={savingAddress}
                  >
                    {savingAddress ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('actions.processing')}
                      </>
                    ) : (
                      <>
                        {t('actions.continueToPayment')}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 支付方式 */}
            {currentStep === CheckoutStep.PAYMENT && clientSecret && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('payment.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      onSuccess={handlePaymentSuccess}
                      totalAmount={total}
                      currencySymbol={currencySymbol}
                      creatingOrder={creatingOrder}
                    />
                  </Elements>
                </CardContent>
              </Card>
            )}

            {/* 订单确认 */}
            {currentStep === CheckoutStep.REVIEW && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('review.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-green-50 p-4 text-green-800">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">{t('review.successTitle')}</span>
                      </div>
                      <p className="mt-2 text-sm">
                        {orderResult
                          ? `${t('review.successDescription')} · ${t('review.orderNumberLabel') || '订单号'} ${orderResult.orderNumber}`
                          : t('review.successDescription')}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() =>
                        router.push(
                          orderResult
                            ? `/account/orders/${orderResult.id}`
                            : '/account/orders',
                        )
                      }
                    >
                      {t('review.viewOrders')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('summary.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('summary.itemsCount', { count: items.length })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 商品列表 */}
                  <div className="max-h-64 space-y-3 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-100">
                          <Image
                            src={item.image || 'https://via.placeholder.com/64'}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('summary.quantityLabel', { count: item.quantity })}
                          </p>
                          <p className="text-sm font-medium">
                            {currencySymbol}
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* 价格明细 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('summary.subtotal')}</span>
                      <span>
                        {currencySymbol}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('summary.shipping')}</span>
                      <span>
                        {currencySymbol}
                        {shipping.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('summary.tax')}</span>
                      <span>
                        {currencySymbol}
                        {tax.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t('summary.total')}</span>
                      <span>
                        {currencySymbol}
                        {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 安全提示 */}
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>{t('summary.securePayment')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 支付表单组件
function PaymentForm({
  onSuccess,
  totalAmount,
  currencySymbol,
  creatingOrder,
}: {
  onSuccess: () => Promise<void>;
  totalAmount: number;
  currencySymbol: string;
  creatingOrder: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { t } = useStaticTranslations('checkout');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || t('toast.paymentFailed'));
      } else {
        toast.success(t('toast.paymentSuccess'));
        await onSuccess();
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      if (!(error as any)?.__handled) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('toast.paymentProcessingFailed'),
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || processing || creatingOrder}
      >
        {processing || creatingOrder
          ? t('payment.processing')
          : t('payment.payAmount', {
              amount: `${currencySymbol}${totalAmount.toFixed(2)}`,
            })}
      </Button>
    </form>
  );
}
