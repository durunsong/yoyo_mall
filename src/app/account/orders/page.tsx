/**
 * 用户订单列表页面
 * 展示用户的所有订单，支持筛选和查看详情
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Package,
  ChevronRight,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import { normalizeMoney } from '@/lib/money';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
      images: { url: string; alt: string }[];
    };
  }[];
}

// 前端展示用的订单状态列表，需与后端保持一致
const ORDER_STATUS_LIST = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const;

export default function OrdersPage() {
  const router = useRouter();
  const { t, locale } = useStaticTranslations('orders');
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  });

  // 检查登录状态
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  // 根据当前标签状态动态请求订单数据
  const fetchOrders = useCallback(
    async (statusValue: string) => {
      if (!session) return;

      try {
        setListLoading(true);

        const params = new URLSearchParams();
        if (statusValue !== 'all') {
          params.set('status', statusValue);
        }

        const queryString = params.toString();
        const response = await fetch(`/api/orders${queryString ? `?${queryString}` : ''}`);
        const data = await response.json();

        if (data.success) {
          const normalizedOrders: Order[] = (data.data ?? []).map((order: Order) => ({
            ...order,
            totalAmount: normalizeMoney(order.totalAmount),
            items: order.items.map((item) => ({
              ...item,
              unitPrice: normalizeMoney(item.unitPrice),
            })),
          }));
          setOrders(normalizedOrders);

          // 优先使用后端返回的统计数据，缺失时回退到前端计算
          const fallbackCounts = ORDER_STATUS_LIST.reduce<Record<string, number>>((acc, currentStatus) => {
            acc[currentStatus] = normalizedOrders.filter((order) => order.status === currentStatus).length;
            return acc;
          }, {});

          setStatusCounts({
            all: data.counts?.all ?? data.data.length,
            PENDING: data.counts?.PENDING ?? fallbackCounts.PENDING ?? 0,
            CONFIRMED: data.counts?.CONFIRMED ?? fallbackCounts.CONFIRMED ?? 0,
            PROCESSING: data.counts?.PROCESSING ?? fallbackCounts.PROCESSING ?? 0,
            SHIPPED: data.counts?.SHIPPED ?? fallbackCounts.SHIPPED ?? 0,
            DELIVERED: data.counts?.DELIVERED ?? fallbackCounts.DELIVERED ?? 0,
            CANCELLED: data.counts?.CANCELLED ?? fallbackCounts.CANCELLED ?? 0,
            REFUNDED: data.counts?.REFUNDED ?? fallbackCounts.REFUNDED ?? 0,
          });
        } else {
          toast.error(t('toast.fetchFailed'));
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast.error(t('toast.loadFailed'));
      } finally {
        setListLoading(false);
        setInitialized(true);
      }
    },
    [session, t],
  );

  useEffect(() => {
    if (!session) {
      setInitialized(true);
      return;
    }
    fetchOrders(statusFilter);
  }, [session, statusFilter, fetchOrders]);

  // 订单状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 订单状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4" />;
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // 过滤订单
  const filteredOrders = orders.filter((order) => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(lowerCaseQuery) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(lowerCaseQuery),
      );

    return matchesSearch;
  });

  // 多语言状态名称映射
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('status.pending');
      case 'PROCESSING':
        return t('status.processing');
      case 'SHIPPED':
        return t('status.shipped');
      case 'DELIVERED':
        return t('status.delivered');
      case 'CONFIRMED':
        return t('status.confirmed');
      case 'CANCELLED':
        return t('status.cancelled');
      case 'REFUNDED':
        return t('status.refunded');
      default:
        return status;
    }
  };

  const showInitialLoading = status === 'loading' || (!initialized && !!session);

  // 初次加载时显示整页骨架屏
  if (showInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 标题骨架 */}
          <div className="mb-8">
            <div className="skeleton-wave mb-2 h-9 w-32 rounded" />
            <div className="skeleton-wave h-5 w-64 rounded" />
          </div>

          {/* 搜索栏骨架 */}
          <div className="mb-6">
            <div className="skeleton-wave h-10 w-full max-w-md rounded" />
          </div>

          {/* 标签页骨架 */}
          <div className="skeleton-wave mb-6 h-10 w-full max-w-2xl rounded" />

          {/* 订单列表骨架 */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="bg-gray-50 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="skeleton-wave h-5 w-48 rounded" />
                      <div className="skeleton-wave h-4 w-40 rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <div className="skeleton-wave h-4 w-16 rounded" />
                        <div className="skeleton-wave h-6 w-20 rounded" />
                      </div>
                      <div className="skeleton-wave h-9 w-24 rounded" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex gap-4">
                        <div className="skeleton-wave h-16 w-16 rounded-md" />
                        <div className="flex flex-1 items-center justify-between">
                          <div className="space-y-2">
                            <div className="skeleton-wave h-4 w-32 rounded" />
                            <div className="skeleton-wave h-3 w-20 rounded" />
                          </div>
                          <div className="skeleton-wave h-5 w-16 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="skeleton-wave h-9 w-24 rounded" />
                    <div className="skeleton-wave h-9 w-24 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题区域，多语言展示页面主标题与副标题 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="pl-9"
            />
          </div>
        </div>

        {/* 状态标签 */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              {t('tabs.all', { count: statusCounts.all })}
            </TabsTrigger>
            <TabsTrigger value="PENDING">
              {t('tabs.pending', { count: statusCounts.PENDING })}
            </TabsTrigger>
            <TabsTrigger value="CONFIRMED">
              {t('tabs.confirmed', { count: statusCounts.CONFIRMED })}
            </TabsTrigger>
            <TabsTrigger value="PROCESSING">
              {t('tabs.processing', { count: statusCounts.PROCESSING })}
            </TabsTrigger>
            <TabsTrigger value="SHIPPED">
              {t('tabs.shipped', { count: statusCounts.SHIPPED })}
            </TabsTrigger>
            <TabsTrigger value="DELIVERED">
              {t('tabs.delivered', { count: statusCounts.DELIVERED })}
            </TabsTrigger>
            <TabsTrigger value="CANCELLED">
              {t('tabs.cancelled', { count: statusCounts.CANCELLED })}
            </TabsTrigger>
            <TabsTrigger value="REFUNDED">
              {t('tabs.refunded', { count: statusCounts.REFUNDED })}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 订单列表 */}
        {listLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gray-50 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                      <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="space-y-2 text-right">
                        <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                        <div className="h-6 w-24 rounded bg-gray-200 animate-pulse" />
                      </div>
                      <div className="h-9 w-24 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {Array.from({ length: 2 }).map((_, itemIndex) => (
                    <div key={itemIndex} className="flex gap-4">
                      <div className="h-16 w-16 rounded-md bg-gray-100 animate-pulse" />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                          <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                        </div>
                        <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('empty.title')}</h3>
              <p className="mb-6 text-gray-600">{t('empty.description')}</p>
              <Link href="/products">
                <Button>{t('empty.cta')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {t('order.orderNumber', { number: order.orderNumber })}
                        </span>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('order.createdAt', {
                          time: new Date(order.createdAt).toLocaleString(locale),
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('order.totalLabel')}</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          {t('order.viewDetail')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-100">
                          <Image
                            src={
                              item.product.images?.[0]?.url ||
                              'https://via.placeholder.com/64'
                            }
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {item.product.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t('order.quantity', { count: item.quantity })}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 订单操作按钮 */}
                  <div className="mt-4 flex gap-2">
                    {order.status === 'PENDING' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/checkout?orderId=${order.id}`}>
                          {t('actions.payNow')}
                        </Link>
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/account/orders/${order.id}`}>
                          {t('actions.trackShipment')}
                        </Link>
                      </Button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/account/orders/${order.id}`}>
                          {t('actions.reviewProduct')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
