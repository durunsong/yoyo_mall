/**
 * 管理后台 - Dashboard 仪表板页面
 * 展示系统概览和关键指标
 */

'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { LineChart, PieChart } from '@/components/admin/charts';
import { toast } from 'sonner';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/admin/admin-skeleton';

interface DashboardData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalProducts: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    ordersGrowth: number;
    usersGrowth: number;
    revenueGrowth: number;
  };
  recentOrders: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  latestOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics?period=7');
        const result = await response.json();

        if (result.success) {
          setData({
            overview: result.data.overview,
            recentOrders: result.data.charts.orders,
            latestOrders: result.data.latestOrders,
          });
        } else {
          toast.error(result.error || '加载数据失败');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染增长指标
  const renderGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const color = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <Icon className="h-4 w-4" />
        <span>{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  // 订单状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any; icon: any } } = {
      PENDING: { label: '待处理', variant: 'secondary', icon: Clock },
      CONFIRMED: { label: '已确认', variant: 'default', icon: CheckCircle },
      PROCESSING: { label: '处理中', variant: 'default', icon: Package },
      SHIPPED: { label: '已发货', variant: 'default', icon: ShoppingCart },
      DELIVERED: { label: '已完成', variant: 'default', icon: CheckCircle },
      CANCELLED: { label: '已取消', variant: 'destructive', icon: AlertCircle },
      REFUNDED: { label: '已退款', variant: 'destructive', icon: AlertCircle },
    };
    const info = statusMap[status] || { label: status, variant: 'secondary', icon: Clock };
    const StatusIcon = info.icon;
    return (
      <Badge variant={info.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  if (loading || !data) {
    return (
      <AdminLayout>
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
            <p className="text-gray-600 mt-1">系统概览和关键指标</p>
          </div>
          <Button asChild>
            <Link href="/admin/analytics">查看详细分析</Link>
          </Button>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总营收</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.overview.totalRevenue)}
              </div>
              {renderGrowth(data.overview.revenueGrowth)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总订单</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalOrders}</div>
              {renderGrowth(data.overview.ordersGrowth)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总用户</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
              {renderGrowth(data.overview.usersGrowth)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总商品</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalProducts}</div>
              <p className="text-sm text-gray-500 mt-1">库存总数</p>
            </CardContent>
          </Card>
        </div>

        {/* 订单状态统计 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">待处理订单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {data.overview.pendingOrders}
              </div>
              <p className="text-xs text-gray-500 mt-1">需要及时处理</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">处理中订单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.overview.processingOrders}
              </div>
              <p className="text-xs text-gray-500 mt-1">正在处理中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">已完成订单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.overview.completedOrders}
              </div>
              <p className="text-xs text-gray-500 mt-1">成功完成</p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 近7天订单趋势 */}
          <Card>
            <CardHeader>
              <CardTitle>近7天订单趋势</CardTitle>
              <CardDescription>订单数量变化</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={{
                  xAxis: data.recentOrders.map(item => {
                    const date = new Date(item.date);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }),
                  series: [
                    {
                      name: '订单数量',
                      data: data.recentOrders.map(item => item.count),
                      color: '#3b82f6',
                    },
                  ],
                }}
                height={250}
              />
            </CardContent>
          </Card>

          {/* 订单状态分布 */}
          <Card>
            <CardHeader>
              <CardTitle>订单状态分布</CardTitle>
              <CardDescription>当前订单状态占比</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={[
                  { name: '待处理', value: data.overview.pendingOrders },
                  { name: '处理中', value: data.overview.processingOrders },
                  { name: '已完成', value: data.overview.completedOrders },
                ]}
                height={250}
              />
            </CardContent>
          </Card>
        </div>

        {/* 最近订单 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>最近订单</CardTitle>
                <CardDescription>最新的订单记录</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">查看全部</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.latestOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {order.user.name} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/products">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  商品管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">管理商品信息和库存</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/orders">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  订单管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">处理和跟踪订单</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/users">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  用户管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">管理用户账户</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/analytics">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  数据分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">查看详细数据报表</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}



