/**
 * 用户账户中心主页
 * 展示用户信息概览和快捷入口
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStaticTranslations } from '@/hooks/use-i18n';
import type { AccountStats } from '@/lib/account/stats';

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useStaticTranslations('account');

  const [stats, setStats] = useState<AccountStats>({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    wishlistCount: 0,
    addressCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
    }
  }, [session, status, router]);

  // 获取用户统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(false);
        const response = await fetch('/api/user/summary');
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || '加载账户摘要失败');
        }
        setStats(data.data.stats);
        setRecentOrders(data.data.recentOrders || []);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStatsError(true);
      } finally {
        setStatsLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 用户信息卡片骨架 */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="skeleton-wave h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="skeleton-wave h-7 w-32 rounded" />
                  <div className="skeleton-wave h-5 w-48 rounded" />
                  <div className="skeleton-wave h-6 w-16 rounded-full" />
                </div>
                <div className="skeleton-wave h-10 w-28 rounded" />
              </div>
            </CardContent>
          </Card>

          {/* 订单统计骨架 */}
          <Card className="mb-8">
            <CardHeader>
              <div className="skeleton-wave h-6 w-32 rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="skeleton-wave h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <div className="skeleton-wave h-4 w-16 rounded" />
                        <div className="skeleton-wave h-7 w-12 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="skeleton-wave mt-4 h-10 w-full rounded" />
            </CardContent>
          </Card>

          {/* 快捷入口骨架 */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="skeleton-wave mb-4 h-12 w-12 rounded-lg" />
                  <div className="skeleton-wave mb-1 h-5 w-24 rounded" />
                  <div className="skeleton-wave h-4 w-32 rounded" />
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

  // 快捷入口配置
  const quickLinks = [
    {
      icon: Package,
      title: t('dashboard.quickLinks.orders.title'),
      description: t('dashboard.quickLinks.orders.description', { count: stats.totalOrders }),
      href: '/account/orders',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: t('dashboard.quickLinks.addresses.title'),
      description: t('dashboard.quickLinks.addresses.description', { count: stats.addressCount }),
      href: '/account/addresses',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Heart,
      title: t('dashboard.quickLinks.wishlist.title'),
      description: t('dashboard.quickLinks.wishlist.description', { count: stats.wishlistCount }),
      href: '/account/wishlist',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Settings,
      title: t('dashboard.quickLinks.settings.title'),
      description: t('dashboard.quickLinks.settings.description'),
      href: '/account/settings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // 订单状态统计
  const orderStats = [
    {
      icon: Clock,
      label: t('dashboard.orderStats.pending'),
      count: stats.pendingOrders,
      color: 'text-yellow-600',
    },
    {
      icon: Truck,
      label: t('dashboard.orderStats.shipped'),
      count: stats.shippedOrders,
      color: 'text-blue-600',
    },
    {
      icon: CheckCircle,
      label: t('dashboard.orderStats.completed'),
      count: stats.completedOrders,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                <AvatarFallback className="bg-blue-600 text-lg text-white">
                  {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="mb-1 text-2xl font-bold text-gray-900">
                  {session.user?.name || t('dashboard.defaultUserName')}
                </h1>
                <p className="mb-2 text-gray-600">{session.user?.email}</p>
                <Badge variant="outline">{t('dashboard.memberBadge')}</Badge>
              </div>
              <Link href="/account/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  {t('dashboard.editProfile')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 订单统计 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('dashboard.ordersTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {orderStats.map((stat) => {
                const IconComponent = stat.icon;
                return (
                  <Link
                    key={stat.label}
                    href="/account/orders"
                    className="flex items-center gap-3 rounded-lg p-4 transition-colors shadow-sm hover:bg-gray-50"
                  >
                    <div className={`rounded-full p-3 ${stat.color} bg-opacity-10`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/account/orders">
              <Button variant="outline" className="mt-4 w-full gap-2">
                {t('dashboard.viewAllOrders')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link key={link.title} href={link.href}>
                <Card className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className={`inline-flex rounded-lg p-3 ${link.bgColor}`}>
                        <IconComponent className={`h-6 w-6 ${link.color}`} />
                      </div>
                    </div>
                    <h3 className="mb-1 font-semibold text-gray-900">{link.title}</h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                    <ChevronRight className="mt-2 h-5 w-5 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 最近订单 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t('dashboard.recentOrders.title')}
              </span>
              <Link href="/account/orders">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t('dashboard.recentOrders.viewAll')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="skeleton-wave h-14 rounded" />
                ))}
              </div>
            ) : statsError ? (
              <div className="py-8 text-center text-gray-500">
                <p>{t('dashboard.loadFailed')}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  {t('dashboard.retry')}
                </Button>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p>{t('dashboard.recentOrders.empty')}</p>
                <Link href="/products">
                  <Button variant="outline" className="mt-4">
                    {t('dashboard.recentOrders.cta')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {order.currency} {Number(order.totalAmount).toFixed(2)}
                      </p>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
