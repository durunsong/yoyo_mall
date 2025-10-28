/**
 * 数据分析页面
 * 展示销售趋势、用户增长、热门商品等统计数据
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// 数据类型定义
interface AnalyticsData {
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
  charts: {
    orders: Array<{
      date: string;
      count: number;
      revenue: number;
    }>;
    users: Array<{
      date: string;
      count: number;
    }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string | null;
    orderCount: number;
    totalQuantity: number;
  }>;
  latestOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // 默认30天
  const [data, setData] = useState<AnalyticsData | null>(null);

  // 加载数据
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || '加载数据失败');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

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
    });
  };

  // 订单状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      PENDING: { label: '待处理', variant: 'secondary' },
      CONFIRMED: { label: '已确认', variant: 'default' },
      PROCESSING: { label: '处理中', variant: 'default' },
      SHIPPED: { label: '已发货', variant: 'default' },
      DELIVERED: { label: '已完成', variant: 'default' },
      CANCELLED: { label: '已取消', variant: 'destructive' },
      REFUNDED: { label: '已退款', variant: 'destructive' },
    };
    const info = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={info.variant}>{info.label}</Badge>;
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

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
        <p className="text-gray-600 mt-1">查看销售数据和分析报表</p>
      </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">最近 7 天</SelectItem>
              <SelectItem value="30">最近 30 天</SelectItem>
              <SelectItem value="90">最近 90 天</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总营收</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-500" />
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
              <ShoppingCart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalOrders}</div>
              {renderGrowth(data.overview.ordersGrowth)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总用户</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
              {renderGrowth(data.overview.usersGrowth)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总商品</CardTitle>
              <Package className="h-4 w-4 text-gray-500" />
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
            </CardContent>
          </Card>
        </div>

        {/* 销售趋势图表（简化版条形图） */}
        <Card>
          <CardHeader>
            <CardTitle>销售趋势</CardTitle>
            <CardDescription>最近{period}天的订单和营收趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 订单趋势 */}
              <div>
                <h4 className="text-sm font-medium mb-2">订单数量</h4>
                <div className="space-y-2">
                  {data.charts.orders.slice(-7).map((item, index) => {
                    const maxCount = Math.max(...data.charts.orders.map(o => o.count));
                    const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-20 text-xs text-gray-500">
                          {formatDate(item.date)}
                        </div>
                        <div className="flex-1 relative h-8">
                          <div
                            className="absolute left-0 top-0 h-full bg-blue-500 rounded"
                            style={{ width: `${width}%` }}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                            {item.count} 单
                          </span>
                        </div>
                        <div className="w-24 text-xs text-right text-gray-500">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 热门商品 */}
          <Card>
            <CardHeader>
              <CardTitle>热门商品</CardTitle>
              <CardDescription>销量最高的商品</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.totalQuantity}</p>
                      <p className="text-xs text-gray-500">
                        {product.orderCount} 订单
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最近订单 */}
          <Card>
            <CardHeader>
              <CardTitle>最近订单</CardTitle>
              <CardDescription>最新的订单记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.latestOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {order.user.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 用户增长趋势 */}
      <Card>
        <CardHeader>
            <CardTitle>用户增长</CardTitle>
            <CardDescription>新注册用户趋势</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
              {data.charts.users.slice(-7).map((item, index) => {
                const maxCount = Math.max(...data.charts.users.map(u => u.count));
                const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-gray-500">
                      {formatDate(item.date)}
                    </div>
                    <div className="flex-1 relative h-6">
                      <div
                        className="absolute left-0 top-0 h-full bg-green-500 rounded"
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                        {item.count} 用户
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
