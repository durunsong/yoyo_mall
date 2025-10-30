/**
 * 用户通知中心页面
 * 显示所有通知消息
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Package,
  Gift,
  Heart,
  CheckCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 通知类型
type NotificationType = 'order' | 'system' | 'promotion' | 'wishlist';

// 通知接口
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

// 通知图标映射
const notificationIcons: Record<NotificationType, any> = {
  order: Package,
  system: Bell,
  promotion: Gift,
  wishlist: Heart,
};

// 通知颜色映射
const notificationColors: Record<NotificationType, string> = {
  order: 'text-blue-600 bg-blue-50',
  system: 'text-gray-600 bg-gray-50',
  promotion: 'text-pink-600 bg-pink-50',
  wishlist: 'text-red-600 bg-red-50',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 模拟通知数据
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // 模拟加载通知
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: '订单已发货',
          message: '您的订单 #12345 已发货，预计3天内送达',
          read: false,
          link: '/orders/12345',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: '2',
          type: 'promotion',
          title: '限时优惠',
          message: '全场商品8折优惠，仅限今天！',
          read: false,
          link: '/deals',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          id: '3',
          type: 'wishlist',
          title: '心愿单商品降价',
          message: '您收藏的"MacBook Pro"降价了，快来看看！',
          read: true,
          link: '/account/wishlist',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: '4',
          type: 'order',
          title: '订单已签收',
          message: '您的订单 #12344 已签收，感谢购买！',
          read: true,
          link: '/orders/12344',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: '5',
          type: 'system',
          title: '账户安全提醒',
          message: '您的密码已超过90天未更改，建议定期更改密码',
          read: true,
          link: '/account/settings',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];
      setNotifications(mockNotifications);
      setLoading(false);
    }, 500);
  }, [status, router]);

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 标记所有为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('已标记所有通知为已读');
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('通知已删除');
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // 过滤通知
  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <CardTitle>通知中心</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} 条未读</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="cursor-pointer"
              >
                全部
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="cursor-pointer"
              >
                未读
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="cursor-pointer"
                >
                  全部已读
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'unread' ? '没有未读通知' : '暂无通知'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(notification => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 transition-colors cursor-pointer hover:bg-gray-50 relative group',
                      !notification.read && 'bg-blue-50/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* 未读标记 */}
                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600" />
                    )}

                    <div className="flex items-start gap-4 pl-4">
                      {/* 图标 */}
                      <div
                        className={cn(
                          'flex-shrink-0 p-2 rounded-full',
                          colorClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3
                              className={cn(
                                'text-sm font-medium mb-1',
                                !notification.read
                                  ? 'text-gray-900'
                                  : 'text-gray-600'
                              )}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* 删除按钮 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

