/**
 * Newsletter 管理后台 - 订阅者列表和营销活动
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Send, Download, Search } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
  confirmedAt: string | null;
  source: string | null;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  unsubscribed: number;
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/subscribers');
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.data.subscribers);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('加载订阅者失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">已激活</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">待验证</Badge>;
      case 'UNSUBSCRIBED':
        return <Badge className="bg-gray-500">已取消</Badge>;
      case 'BOUNCED':
        return <Badge className="bg-red-500">退回</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Newsletter 管理</h1>
          <p className="text-muted-foreground">管理邮件订阅者和发送营销活动</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">总订阅数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">已激活</CardTitle>
              <Mail className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">待验证</CardTitle>
              <Mail className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">已取消</CardTitle>
              <Mail className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unsubscribed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="subscribers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscribers">订阅者管理</TabsTrigger>
            <TabsTrigger value="campaigns">营销活动</TabsTrigger>
          </TabsList>

          {/* 订阅者列表 */}
          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>订阅者列表</CardTitle>
                    <CardDescription>管理所有 Newsletter 订阅者</CardDescription>
                  </div>
                  <Button onClick={exportSubscribers}>
                    <Download className="mr-2 h-4 w-4" />
                    导出 CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* 搜索和筛选 */}
                <div className="mb-4 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索邮箱..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border px-3 py-2"
                  >
                    <option value="ALL">全部状态</option>
                    <option value="ACTIVE">已激活</option>
                    <option value="PENDING">待验证</option>
                    <option value="UNSUBSCRIBED">已取消</option>
                  </select>
                </div>

                {/* 订阅者表格 */}
                {loading ? (
                  <div className="text-center py-8">加载中...</div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-4 text-left">邮箱</th>
                          <th className="p-4 text-left">状态</th>
                          <th className="p-4 text-left">来源</th>
                          <th className="p-4 text-left">订阅时间</th>
                          <th className="p-4 text-left">确认时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscribers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              暂无订阅者
                            </td>
                          </tr>
                        ) : (
                          filteredSubscribers.map((subscriber) => (
                            <tr key={subscriber.id} className="border-b">
                              <td className="p-4">{subscriber.email}</td>
                              <td className="p-4">{getStatusBadge(subscriber.status)}</td>
                              <td className="p-4">{subscriber.source || '-'}</td>
                              <td className="p-4">
                                {new Date(subscriber.subscribedAt).toLocaleDateString('zh-CN')}
                              </td>
                              <td className="p-4">
                                {subscriber.confirmedAt
                                  ? new Date(subscriber.confirmedAt).toLocaleDateString('zh-CN')
                                  : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 营销活动 */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>营销活动</CardTitle>
                    <CardDescription>从邮件工作台创建、预览并发送营销邮件</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/admin/email">
                      <Send className="mr-2 h-4 w-4" />
                      新建活动
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>准备向订阅者发送一封新邮件？</p>
                  <p className="text-sm mt-2">在邮件工作台中选择收件人、编辑内容并确认合规声明后即可发送。</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
