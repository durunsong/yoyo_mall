'use client';

import { useState, useEffect } from 'react';
import { Bell, Package, ShoppingCart, Users, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
 * 后台通知中心组件
 * 功能:
 * - 显示系统通知
 * - 新订单提醒
 * - 库存预警
 * - 用户反馈
 * - 标记已读/未读
 * - 跳转到相关页面
 */
export function AdminNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // 加载通知
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  // 定期刷新通知
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // 每分钟刷新一次
    return () => clearInterval(interval);
  }, []);

  // 加载通知列表
  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
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
      }
    } catch (error) {
      console.error('标记已读失败:', error);
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
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success('已删除通知');
      }
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
      setOpen(false);
    }
  };

  // 获取图标
  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'product':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'user':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 未读数量
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-sm">通知中心</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} 条未读
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs">
              全部已读
            </Button>
          )}
        </div>

        {/* 通知列表 */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* 图标 */}
                    <div className="mt-0.5">{getIcon(notification.type)}</div>

                    {/* 内容 */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                    </div>

                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">暂无通知</p>
            </div>
          )}
        </div>

        {/* 底部 */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                router.push('/admin/notifications');
                setOpen(false);
              }}
            >
              查看全部通知
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

