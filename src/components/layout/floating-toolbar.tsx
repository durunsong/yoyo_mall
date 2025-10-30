/**
 * 浮动工具栏组件
 * 固定在页面右侧的快捷操作工具栏
 * 参考 kakobuy.com 设计
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Heart, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { toast } from 'sonner';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

export function FloatingToolbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const [cartAnimation, setCartAnimation] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // 初始为 null
  const [isClient, setIsClient] = useState(false); // 客户端标记
  const [showScrollTop, setShowScrollTop] = useState(false); // 是否显示返回顶部
  const { items } = useCartStore();
  const wishlistItems = useWishlistStore(state => state.items);

  // 购物车数量
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // 心愿单数量
  const wishlistCount = wishlistItems.length;
  
  // 上一次的心愿单数量
  const [prevWishlistCount, setPrevWishlistCount] = useState(wishlistCount);

  // 客户端挂载后才初始化时间
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 监听滚动显示返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    // 添加滚动监听
    window.addEventListener('scroll', handleScroll);
    
    // 初始检查
    handleScroll();

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

  // 监听心愿单变化触发动画
  useEffect(() => {
    if (wishlistCount > prevWishlistCount) {
      // 只有增加时才触发动画
      setWishlistAnimation(true);
      const timer = setTimeout(() => {
        setWishlistAnimation(false);
        setPrevWishlistCount(wishlistCount);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setPrevWishlistCount(wishlistCount);
    }
  }, [wishlistCount, prevWishlistCount]);

  // 跳转到购物车
  const handleCartClick = () => {
    // 购物车不需要登录,游客也可以使用
    router.push('/cart');
  };

  // 跳转到心愿单
  const handleWishlistClick = () => {
    // 心愿单需要登录
    if (!session) {
      toast.error('请先登录后再查看心愿单');
      openModal('login');
      return;
    }
    router.push('/account/wishlist');
  };

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 如果还未挂载到客户端,显示占位符
  if (!isClient || !currentTime) {
    return (
      <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-0 md:right-4">
        {/* 时间显示 - 顶部(占位符) */}
        <div className="mb-1 w-16 rounded-t-xl bg-white px-2 py-2 text-center shadow-md">
          <div className="text-[10px] leading-tight text-gray-500">UTC+8</div>
          <div className="text-[10px] leading-tight text-gray-500">Oct 29</div>
          <div className="mt-1 text-xs font-bold leading-tight text-gray-900">--:--:--</div>
        </div>

        {/* 购物车按钮 */}
        <div className="relative w-16">
          <button className="relative flex h-12 w-full items-center justify-center bg-white transition-all hover:bg-gray-50">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* 心愿单按钮 */}
        <div className="w-16">
          <button className="flex h-12 w-full items-center justify-center bg-white transition-all hover:bg-gray-50">
            <Heart className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Discord 按钮 - 底部 */}
        <div className="w-16 rounded-b-xl bg-white shadow-md">
          <button className="flex h-12 w-full items-center justify-center rounded-b-xl transition-all hover:bg-gray-50">
            <svg className="h-6 w-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-0 md:right-4">
      {/* 时间显示 - 顶部 */}
      <div className="mb-1 w-16 rounded-t-xl bg-white px-2 py-2 text-center shadow-md">
        <div className="text-[10px] leading-tight text-gray-500">
          UTC+8
        </div>
        <div className="text-[10px] leading-tight text-gray-500">
          {currentTime.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }).replace(' ', ' ')}
        </div>
        <div className="mt-1 text-xs font-bold leading-tight text-gray-900">
          {currentTime.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>

      {/* 购物车按钮 - 带悬停卡片 */}
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="relative w-16">
            <button
              onClick={handleCartClick}
              className={cn(
                'relative flex h-12 w-full items-center justify-center bg-white transition-all hover:bg-gray-50',
                cartAnimation && 'animate-bounce'
              )}
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {cartCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
                    cartAnimation && 'animate-pulse'
                  )}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </HoverCardTrigger>
        <HoverCardContent 
          side="left" 
          align="start" 
          className="w-80 p-0"
          sideOffset={8}
        >
          <div className="p-4">
            <h3 className="mb-3 text-lg font-semibold">Cart({cartCount})</h3>
            
            {items.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-4xl">🛒</div>
                <p className="text-sm text-gray-500">Your cart is currently empty.</p>
                <p className="mt-1 text-xs text-gray-400">Reward yourself by going shopping.</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border">
                        <Image
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-semibold text-blue-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-center text-xs text-gray-400">
                      +{items.length - 3} more items
                    </p>
                  )}
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCartClick}
                >
                  Check out cart
                </Button>
              </>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* 心愿单按钮 - 带动画效果 */}
      <div className="relative w-16">
        <button
          onClick={handleWishlistClick}
          className={cn(
            'relative flex h-12 w-full items-center justify-center bg-white transition-all hover:bg-pink-50',
            wishlistAnimation && 'animate-bounce'
          )}
        >
          <Heart 
            className={cn(
              'h-5 w-5 transition-all duration-300',
              wishlistCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-700',
              wishlistAnimation && 'scale-125'
            )}
          />
          {wishlistCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-lg',
                wishlistAnimation && 'animate-ping'
              )}
            >
              {wishlistCount > 9 ? '9+' : wishlistCount}
            </span>
          )}
          {/* 添加成功的涟漪效果 */}
          {wishlistAnimation && (
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping" />
          )}
        </button>
      </div>

      {/* 返回顶部按钮 - 仅在滚动时显示 */}
      {showScrollTop && (
        <div className="mt-1 w-16 mb-1">
          <button
            onClick={scrollToTop}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-white shadow-md transition-all hover:bg-gray-50 hover:scale-105 animate-fade-in"
            title="返回顶部"
          >
            <ArrowUp className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      )}

      {/* Discord 按钮 - 底部 */}
      <div className={cn("w-16 bg-white shadow-md rounded-lg", !showScrollTop && "rounded-b-xl")}>
        <button
          onClick={() => toast.info('Discord 功能即将上线')}
          className={cn(
            "flex h-12 w-full items-center justify-center transition-all hover:bg-gray-50",
            !showScrollTop && "rounded-b-xl"
          )}
        >
          <svg
            className="h-6 w-6 text-[#5865F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </button>
      </div>
    </div>
  );
}



