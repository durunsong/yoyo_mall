/**
 * 用户通知组件
 * 前台用户的通知中心，显示订单、系统等通知
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, Package, Heart, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

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
const notificationIcons: Record<NotificationType, LucideIcon> = {
  order: Package,
  system: Bell,
  promotion: Gift,
  wishlist: Heart,
};

// 通知颜色映射
const notificationColors: Record<NotificationType, string> = {
  order: 'text-blue-600',
  system: 'text-gray-600',
  promotion: 'text-pink-600',
  wishlist: 'text-red-600',
};

export function UserNotifications() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 从localStorage初始化通知（持久化）
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('user-notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<Notification & { createdAt: string }>;
        // 将字符串日期转换为Date对象
        return parsed.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // 确保客户端挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载通知数据 - 页面加载时就获取，不等用户点击
  useEffect(() => {
    if (session?.user && mounted) {
      // 从localStorage加载已有的通知，或使用模拟数据
      const saved = localStorage.getItem('user-notifications');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Array<Notification & { createdAt: string }>;
          // 将字符串日期转换为Date对象
          const withDates = parsed.map((n) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }));
          setNotifications(withDates);
          return;
        } catch {
          // 解析失败，使用默认数据
        }
      }

      // 首次加载：使用模拟数据
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
      ];
      setNotifications(mockNotifications);
      localStorage.setItem('user-notifications', JSON.stringify(mockNotifications));
    }
  }, [session, mounted]);

  // 通知变化时保存到localStorage
  useEffect(() => {
    if (mounted && notifications.length > 0) {
      localStorage.setItem('user-notifications', JSON.stringify(notifications));
    }
  }, [notifications, mounted]);

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
    // 这里应该调用API标记为已读
  };

  // 标记所有为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // 这里应该调用API标记所有为已读
  };

  // 清除通知
  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    // 这里应该调用API删除通知
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  // 格式化时间
  const formatTime = (date: Date | string) => {
    const now = new Date();
    // 确保date是Date对象
    const dateObj = date instanceof Date ? date : new Date(date);
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return dateObj.toLocaleDateString();
  };

  // 未登录时不显示
  if (!session?.user) {
    return null;
  }

  // 未读数量
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-100 transition-colors border-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] animate-pulse bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-sm">通知</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} 条未读
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="h-7 text-xs hover:bg-gray-200"
            >
              全部已读
            </Button>
          )}
        </div>

        {/* 通知列表 */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无通知</p>
            </div>
          ) : (
            notifications.map(notification => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 relative group shadow-sm',
                    !notification.read && 'bg-blue-50/50',
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* 未读标记 */}
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600" />
                  )}

                  <div className="flex items-start gap-3 pl-3">
                    {/* 图标 */}
                    <div className={cn('flex-shrink-0 mt-0.5', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm font-medium',
                          !notification.read && 'text-gray-900',
                          notification.read && 'text-gray-600',
                        )}>
                          {notification.title}
                        </p>
                        
                        {/* 删除按钮 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => removeNotification(notification.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部 */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs hover:bg-gray-100"
                onClick={() => {
                  router.push('/account/notifications');
                  setOpen(false);
                }}
              >
                查看所有通知
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

