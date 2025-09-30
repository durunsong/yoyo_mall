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

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useStaticTranslations('common');

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    wishlistCount: 0,
    addressCount: 0,
  });

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
        // TODO: 调用实际API获取统计数据
        setStats({
          totalOrders: 12,
          pendingOrders: 2,
          shippedOrders: 3,
          completedOrders: 7,
          wishlistCount: 8,
          addressCount: 3,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">{t('loading') || '加载中...'}</div>
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
      title: '我的订单',
      description: `${stats.totalOrders} 个订单`,
      href: '/account/orders',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: '收货地址',
      description: `${stats.addressCount} 个地址`,
      href: '/account/addresses',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Heart,
      title: '我的心愿单',
      description: `${stats.wishlistCount} 件商品`,
      href: '/account/wishlist',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Settings,
      title: '账户设置',
      description: '管理个人信息',
      href: '/account/settings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // 订单状态统计
  const orderStats = [
    {
      icon: Clock,
      label: '待付款',
      count: stats.pendingOrders,
      color: 'text-yellow-600',
    },
    {
      icon: Truck,
      label: '待收货',
      count: stats.shippedOrders,
      color: 'text-blue-600',
    },
    {
      icon: CheckCircle,
      label: '已完成',
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
                  {session.user?.name || '用户'}
                </h1>
                <p className="mb-2 text-gray-600">{session.user?.email}</p>
                <Badge variant="outline">会员</Badge>
              </div>
              <Link href="/account/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  编辑资料
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
              我的订单
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
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
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
                查看所有订单
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
                最近订单
              </span>
              <Link href="/account/orders">
                <Button variant="ghost" size="sm" className="gap-1">
                  查看全部
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>暂无最近订单</p>
              <Link href="/products">
                <Button variant="outline" className="mt-4">
                  去购物
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}