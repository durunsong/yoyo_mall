/**
 * 用户订单列表页面
 * 展示用户的所有订单，支持筛选和查看详情
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  ChevronRight,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

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

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useStaticTranslations('common');
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 获取订单列表
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        const data = await response.json();

        if (data.success) {
          setOrders(data.data);
        } else {
          toast.error('获取订单失败');
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast.error('加载订单失败');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

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
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 统计各状态订单数量
  const statusCounts = {
    all: orders.length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    PROCESSING: orders.filter((o) => o.status === 'PROCESSING').length,
    SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">我的订单</h1>
          <p className="text-gray-600">查看和管理您的所有订单</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号或商品..."
              className="pl-9"
            />
          </div>
        </div>

        {/* 状态标签 */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              全部 ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="PENDING">
              待付款 ({statusCounts.PENDING})
            </TabsTrigger>
            <TabsTrigger value="PROCESSING">
              处理中 ({statusCounts.PROCESSING})
            </TabsTrigger>
            <TabsTrigger value="SHIPPED">
              已发货 ({statusCounts.SHIPPED})
            </TabsTrigger>
            <TabsTrigger value="DELIVERED">
              已完成 ({statusCounts.DELIVERED})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 订单列表 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="skeleton-wave h-24 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">暂无订单</h3>
              <p className="mb-6 text-gray-600">您还没有任何订单记录</p>
              <Link href="/products">
                <Button>开始购物</Button>
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
                          订单号: {order.orderNumber}
                        </span>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        下单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">订单金额</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          查看详情
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
                            <p className="text-sm text-gray-600">数量: {item.quantity}</p>
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
                      <Button variant="outline" size="sm">
                        立即付款
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button variant="outline" size="sm">
                        查看物流
                      </Button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <Button variant="outline" size="sm">
                        评价商品
                      </Button>
                    )}
                    {order.status === 'PENDING' && (
                      <Button variant="outline" size="sm" className="text-red-600">
                        取消订单
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
