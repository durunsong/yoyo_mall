/**
 * 用户通知组件
 * 前台用户的通知中心，显示订单、系统等通知
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, Package, Heart, Gift, Loader2, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  // 通知状态
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 确保客户端挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载通知数据 - 从API获取
  useEffect(() => {
    if (session?.user && mounted) {
      loadNotifications();
    }
  }, [session, mounted]);

  // 当下拉菜单打开时刷新通知
  useEffect(() => {
    if (open && session?.user) {
      loadNotifications();
    }
  }, [open, session]);

  // 加载通知列表
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notifications');
      const data = await response.json();

      if (data.success) {
        // 将API返回的数据转换为Notification格式，确保createdAt是Date对象
        const formattedNotifications: Notification[] = (data.data || []).map(
          (n: Notification & { createdAt: string }) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }),
        );
        setNotifications(formattedNotifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记为已读
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${id}/read`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/user/notifications/read-all', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 清除通知
  const removeNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/user/notifications/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        const deletedNotification = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        // 如果删除的是未读通知，更新未读数量
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  // 点击通知
  const handleNotificationClick = async (notification: Notification) => {
    // 如果未读，先标记为已读
    if (!notification.read) {
      await markAsRead(notification.id);
    }
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

  // 未读数量（从状态获取，不再从notifications计算）

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
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-foreground" aria-label="加载中" />
              <p className="text-sm text-gray-500 mt-2">加载中...</p>
            </div>
          ) : notifications.length === 0 ? (
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
