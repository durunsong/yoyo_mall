'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, CheckCircle, Clock, MapPin, Package, RefreshCw, Truck, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { normalizeMoney } from '@/lib/money';

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  createdAt: string;
  subtotal: number | string;
  taxAmount: number | string;
  shippingAmount: number | string;
  discountAmount: number | string;
  dutyAmount: number | string;
  insuranceAmount: number | string;
  totalAmount: number | string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    product: { id: string; name: string; images?: Array<{ url: string; alt?: string | null }> } | null;
    variant?: { name: string; attributes?: Array<{ name: string; value: string }> } | null;
  }>;
  shippingAddress?: {
    firstName?: string | null;
    lastName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
  } | null;
  payments?: Array<{ id: string; status: string; amount: number | string; currency: string; createdAt: string }>;
  shipments?: Array<{ id: string; status: string; trackingNumber?: string | null; carrier?: string | null; deliveredAt?: string | null }>;
};

function statusIcon(status: string) {
  if (status === 'DELIVERED') return <CheckCircle className="h-5 w-5" />;
  if (status === 'CANCELLED' || status === 'REFUNDED') return <XCircle className="h-5 w-5" />;
  if (status === 'SHIPPED' || status === 'PROCESSING') return <Truck className="h-5 w-5" />;
  return <Clock className="h-5 w-5" />;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { status: sessionStatus } = useSession();
  const { t, locale } = useStaticTranslations('orders');
  const orderId = typeof params?.id === 'string' ? params.id : '';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.data) throw new Error('ORDER_LOAD_FAILED');
      setOrder(payload.data as OrderDetail);
    } catch (loadError) {
      console.error('Failed to load order detail:', loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (sessionStatus === 'authenticated') loadOrder();
  }, [loadOrder, router, sessionStatus]);

  const statusLabel = useMemo(() => {
    if (!order) return '';
    return t(`status.${order.status.toLowerCase()}`);
  }, [order, t]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">{t('detail.loadFailed')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('detail.loadFailedDescription')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={loadOrder}><RefreshCw className="mr-2 h-4 w-4" />{t('detail.retry')}</Button>
          <Button variant="outline" asChild><Link href="/account/orders">{t('detail.backToOrders')}</Link></Button>
        </div>
      </div>
    );
  }

  const money = (value: number | string) => `${order.currency === 'USD' ? '$' : `${order.currency} `}${normalizeMoney(value).toFixed(2)}`;
  const address = order.shippingAddress;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />{t('detail.back')}</Button>
        <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">{t('detail.backToOrders')}</Link>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('order.orderNumber', { number: order.orderNumber })}</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">{t('detail.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('order.createdAt', { time: new Date(order.createdAt).toLocaleString(locale) })}</p>
        </div>
        <Badge className="flex items-center gap-2 px-3 py-1.5 text-sm">{statusIcon(order.status)}{statusLabel}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('detail.itemsTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} alt={item.product.images[0].alt || item.product.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.product?.id || ''}`} className="line-clamp-2 font-medium hover:text-primary">{item.product?.name || t('detail.unknownProduct')}</Link>
                    {item.variant?.name && <p className="mt-1 text-sm text-muted-foreground">{item.variant.name}</p>}
                    <p className="mt-1 text-sm text-muted-foreground">{t('order.quantity', { count: item.quantity })}</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{money(normalizeMoney(item.unitPrice) * item.quantity)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {address && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />{t('detail.shippingTitle')}</CardTitle></CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">{address.firstName} {address.lastName}</p>
                <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}{address.phone ? ` · ${address.phone}` : ''}</p>
              </CardContent>
            </Card>
          )}

          {order.shipments?.length ? (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />{t('detail.shipmentTitle')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.shipments.map((shipment) => <div key={shipment.id} className="flex flex-wrap justify-between gap-2"><span>{t(`detail.shipmentStatus.${shipment.status.toLowerCase()}`)}</span><span className="text-muted-foreground">{shipment.carrier || ''}{shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ''}</span></div>)}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader><CardTitle>{t('detail.summaryTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('summary.subtotal')}</span><span>{money(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('summary.shipping')}</span><span>{money(order.shippingAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('summary.tax')}</span><span>{money(order.taxAmount)}</span></div>
            {normalizeMoney(order.dutyAmount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t('summary.duty')}</span><span>{money(order.dutyAmount)}</span></div>}
            {normalizeMoney(order.insuranceAmount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t('summary.insurance')}</span><span>{money(order.insuranceAmount)}</span></div>}
            {normalizeMoney(order.discountAmount) > 0 && <div className="flex justify-between text-emerald-700"><span>{t('summary.discount')}</span><span>-{money(order.discountAmount)}</span></div>}
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>{t('summary.total')}</span><span>{money(order.totalAmount)}</span></div>
            {order.payments?.[0] && <p className="pt-2 text-xs text-muted-foreground">{t('detail.paymentStatus')}: {t(`detail.payment.${order.payments[0].status.toLowerCase()}`)}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
