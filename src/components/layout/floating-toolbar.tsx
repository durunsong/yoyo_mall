/**
 * 浮动工具栏组件
 * 固定在页面右侧的快捷操作工具栏
 * 包含购物车、心愿单、消息等功能
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, MessageCircle, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

export function FloatingToolbar() {
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { items } = useCartStore();

  // 购物车数量
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 监听滚动显示返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 监听购物车变化触发动画
  useEffect(() => {
    if (cartCount > 0) {
      setCartAnimation(true);
      const timer = setTimeout(() => setCartAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 跳转到购物车
  const handleCartClick = () => {
    router.push('/cart');
  };

  // 跳转到心愿单
  const handleWishlistClick = () => {
    router.push('/account/wishlist');
  };

  // 打开消息
  const handleMessageClick = () => {
    // TODO: 实现消息功能
    toast.info('消息功能即将上线');
  };

  return (
    <div className="fixed right-4 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 md:right-6">
      {/* 购物车 */}
      <div className="relative">
        <Button
          size="lg"
          variant="default"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110',
            cartAnimation && 'animate-bounce'
          )}
          onClick={handleCartClick}
        >
          <ShoppingCart className="h-6 w-6" />
        </Button>
        {cartCount > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              'absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold',
              cartAnimation && 'animate-pulse'
            )}
          >
            {cartCount > 99 ? '99+' : cartCount}
          </Badge>
        )}
      </div>

      {/* 心愿单 */}
      <Button
        size="lg"
        variant="outline"
        className="h-14 w-14 rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-red-50 hover:text-red-500"
        onClick={handleWishlistClick}
      >
        <Heart className="h-6 w-6" />
      </Button>

      {/* 消息 */}
      <Button
        size="lg"
        variant="outline"
        className="h-14 w-14 rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 hover:text-blue-500"
        onClick={handleMessageClick}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* 返回顶部 */}
      {showScrollTop && (
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full bg-white shadow-lg transition-all hover:scale-110 animate-fade-in"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}

      {/* 时间显示 */}
      <div className="mt-2 rounded-lg bg-white p-2 text-center shadow-lg">
        <div className="text-xs text-gray-500">
          {currentTime.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <div className="text-sm font-semibold">
          {currentTime.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

