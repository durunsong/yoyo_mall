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
  Bell,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { TableSkeleton } from '@/components/admin/admin-skeleton';

/**
 * 通知类型
 */
interface Notification {
  id: string;
  type: 'order' | 'product' | 'user' | 'system';
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

/**
 * 通知中心页面
 * 显示所有系统通知,支持筛选、标记已读、删除等操作
 */
export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 加载通知
  useEffect(() => {
    loadNotifications();
  }, []);

  // 加载通知列表
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        toast.error('加载通知失败');
      }
    } catch (error) {
      console.error('加载通知失败:', error);
      toast.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

  // 标记为已读
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        toast.success('已标记为已读');
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('操作失败');
    }
  };

  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('已全部标记为已读');
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
      toast.error('操作失败');
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('已删除通知');
    } catch (error) {
      console.error('删除通知失败:', error);
      toast.error('删除失败');
    }
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.url) {
      router.push(notification.url);
    }
  };

  // 获取图标
  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case 'product':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'user':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order':
        return '订单';
      case 'product':
        return '商品';
      case 'user':
        return '用户';
      case 'system':
        return '系统';
      default:
        return '';
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 筛选通知
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  // 未读数量
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <AdminLayout>
        <TableSkeleton rows={8} cols={4} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
            <p className="text-gray-600 mt-1">
              共 {notifications.length} 条通知,{unreadCount} 条未读
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              {filter === 'all' ? '仅显示未读' : '显示全部'}
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead}>全部标记为已读</Button>
            )}
          </div>
        </div>

        {/* 通知列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知列表
            </CardTitle>
            <CardDescription>点击通知查看详情</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      !notification.read
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 图标 */}
                      <div className="mt-1">{getIcon(notification.type)}</div>

                      {/* 内容 */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filter === 'unread' ? '没有未读通知' : '暂无通知'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}



