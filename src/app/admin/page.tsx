/**
 * 管理后台首页
 * 系统概览和仪表板
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
  Bell,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '管理后台',
  description: 'YOYO Mall 管理后台',
};

export default function AdminDashboard() {
  // 模拟数据
  const stats = [
    {
      title: '总销售额',
      value: '¥45,231.89',
      change: '+20.1%',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: '订单数量',
      value: '1,234',
      change: '+15.3%',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: '商品数量',
      value: '856',
      change: '+8.2%',
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: '用户数量',
      value: '2,468',
      change: '+12.5%',
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  const quickActions = [
    {
      title: '商品管理',
      description: '添加、编辑和管理商品',
      href: '/admin/products',
      icon: Package,
    },
    {
      title: '订单管理',
      description: '处理和跟踪订单',
      href: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      title: '用户管理',
      description: '管理用户账户',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: '数据分析',
      description: '查看销售报表',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      href: '/admin/settings',
      icon: Settings,
    },
    {
      title: '内容管理',
      description: '管理页面内容',
      href: '/admin/content',
      icon: FileText,
    },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: '张三', amount: '¥299.00', status: '已发货' },
    { id: 'ORD-002', customer: '李四', amount: '¥599.00', status: '处理中' },
    { id: 'ORD-003', customer: '王五', amount: '¥199.00', status: '已完成' },
    { id: 'ORD-004', customer: '赵六', amount: '¥899.00', status: '待支付' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 管理后台头部 */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
              <p className="text-gray-600">欢迎回来，管理员</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                通知
              </Button>
              <Button asChild>
                <Link href="/">返回前台</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-muted-foreground text-xs">
                    比上月 {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 快速操作 */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">快速操作</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base">
                          {action.title}
                        </CardTitle>
                      </div>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full" variant="outline">
                        <Link href={action.href}>进入管理</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 最近订单 */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">最近订单</h2>
            <Card>
              <CardHeader>
                <CardTitle>订单列表</CardTitle>
                <CardDescription>最新的订单信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.amount}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            order.status === '已完成'
                              ? 'bg-green-100 text-green-800'
                              : order.status === '已发货'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === '处理中'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/orders">查看所有订单</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
