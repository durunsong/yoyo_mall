/**
 * 浮动工具栏组件
 * 固定在页面右侧的快捷操作工具栏
 * 参考 kakobuy.com 设计
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Heart, ArrowUp, Minus, Plus, Trash2, MessageCircle, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import { TawkToAPI } from '@/components/chat/tawk-to-widget';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';
import { SUPPORT_HREF } from '@/lib/navigation/support';

const toolbarShellClass =
  'fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/80 md:right-4 md:flex';
const toolbarButtonClass =
  'relative flex h-12 w-full items-center justify-center bg-transparent transition-colors';

export function FloatingToolbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const { t } = useStaticTranslations('layout');
  const [cartAnimation, setCartAnimation] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // 初始为 null
  const [isClient, setIsClient] = useState(false); // 客户端标记
  const [showScrollTop, setShowScrollTop] = useState(false); // 是否显示返回顶部
  const [mounted, setMounted] = useState(false); // 确保客户端已挂载
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set()); // 正在更新的商品ID
  
  // 使用Zustand store - 确保在客户端正确读取
  const { items, updateQuantity, removeItem, _hasHydrated } = useCartStore();
  const wishlistItems = useWishlistStore(state => state.items);
  
  // 获取系统设置的货币符号
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);

  // 购物车数量 - 只在客户端水合完成后计算
  const cartCount = (mounted && _hasHydrated) ? items.reduce((total, item) => total + item.quantity, 0) : 0;
  
  // 心愿单数量 - 只在客户端渲染后计算
  const wishlistCount = mounted ? wishlistItems.length : 0;
  
  // 上一次的心愿单数量
  const [prevWishlistCount, setPrevWishlistCount] = useState(0);

  // 确保组件已在客户端挂载
  useEffect(() => {
    setMounted(true);
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
      toast.error(t('toolbar.toast.loginWishlist'));
      openModal('login');
      return;
    }
    router.push('/account/wishlist');
  };

  // 更新购物车商品数量
  const handleUpdateQuantity = async (itemId: string, productId: string, newQuantity: number) => {
    if (!session?.user) {
      toast.error(t('toolbar.toast.loginRequired'));
      return;
    }

    // 标记为正在更新
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t('toolbar.toast.updateFailed'));
      }

      // 更新本地store
      updateQuantity(itemId, newQuantity);
      
      if (newQuantity === 0) {
        toast.success(t('toolbar.toast.removed'));
      }
    } catch (error) {
      console.error('更新购物车失败:', error);
      toast.error(error instanceof Error ? error.message : t('toolbar.toast.updateFailed'));
    } finally {
      // 移除更新标记
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // 删除购物车商品
  const handleDeleteItem = async (itemId: string, productName: string) => {
    if (!session?.user) {
      toast.error(t('toolbar.toast.loginRequired'));
      return;
    }

    // 标记为正在更新
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t('toolbar.toast.deleteFailed'));
      }

      // 更新本地store
      removeItem(itemId);
      toast.success(t('toolbar.toast.removed'));
    } catch (error) {
      console.error('删除购物车商品失败:', error);
      toast.error(error instanceof Error ? error.message : t('toolbar.toast.deleteFailed'));
    } finally {
      // 移除更新标记
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 如果还未挂载到客户端,显示占位符
  // 注意：在移动端（< md 断点）隐藏固定工具栏
  if (!isClient || !currentTime) {
    return (
      <div className={toolbarShellClass}>
        {/* 时间显示 - 顶部(占位符) */}
        <div className="w-16 bg-slate-50/90 px-2 py-2 text-center">
          <div className="text-[10px] leading-tight text-gray-500">UTC+8</div>
          <div className="text-[10px] leading-tight text-gray-500">Oct 29</div>
          <div className="mt-1 text-xs font-bold leading-tight text-gray-900">--:--:--</div>
        </div>

        {/* 购物车按钮 */}
        <div className="relative w-16">
          <button className={cn(toolbarButtonClass, 'hover:bg-slate-50')} aria-label="购物车">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* 心愿单按钮 */}
        <div className="w-16">
          <button className={cn(toolbarButtonClass, 'hover:bg-rose-50')} aria-label="心愿单">
            <Heart className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* 在线客服按钮 */}
        <div className="w-16">
          <button className={cn(toolbarButtonClass, 'group hover:bg-emerald-50')} aria-label="在线客服">
            <div className="relative">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
            </div>
          </button>
        </div>

        {/* 帮助与客服入口 - 底部 */}
        <div className="w-16">
          <button
            onClick={() => router.push(SUPPORT_HREF)}
            aria-label={t('toolbar.support')}
            title={t('toolbar.support')}
            className={cn(toolbarButtonClass, 'hover:bg-blue-50')}
          >
            <LifeBuoy className="h-6 w-6 text-blue-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={toolbarShellClass}>
      {/* 时间显示 - 顶部 */}
      <div className="w-16 bg-slate-50/90 px-2 py-2 text-center">
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
                toolbarButtonClass,
                'hover:bg-slate-50',
                cartAnimation && 'animate-pulse-subtle',
              )}
              aria-label="购物车"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {cartCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
                    cartAnimation && 'animate-pulse',
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
            <h3 className="mb-3 text-lg font-semibold">
              {t('toolbar.cartTitle', { count: cartCount })}
            </h3>
            
            {items.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <ShoppingCart className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  {t('toolbar.cartEmptyTitle')}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {t('toolbar.cartEmptyDescription')}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t('toolbar.cartEmptySuggestion')}
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {items.slice(0, 5).map((item) => {
                    const isUpdating = updatingItems.has(item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="group relative flex gap-3 rounded-lg shadow-sm bg-gray-50/50 p-3 transition-all hover:shadow-md hover:bg-blue-50/30"
                      >
                        {/* 删除按钮 - 鼠标悬停显示 */}
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          disabled={isUpdating}
                          className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
                          title={t('toolbar.tooltip.remove')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded shadow-sm bg-white">
                          <Image
                            src={item.image || `${process.env.NEXT_PUBLIC_OSS_BASE_URL || process.env.BASE_OSS_URL}/${process.env.OSS_FOLDER || 'yoyo_mall'}/placeholder.png`}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-800">
                              {item.name}
                            </p>
                          </div>
                          
                          <div className="mt-1 flex items-center justify-between gap-2">
                            {/* 数量加减按钮 */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.productId, Math.max(1, item.quantity - 1))}
                                disabled={isUpdating || item.quantity <= 1}
                                className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                title={t('toolbar.tooltip.decrease')}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              
                              <span className="flex h-6 min-w-[28px] items-center justify-center rounded bg-blue-100 px-2 text-xs font-bold text-blue-700">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.productId, item.quantity + 1)}
                                disabled={isUpdating}
                                className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                title={t('toolbar.tooltip.increase')}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {/* 价格 */}
                            <div className="text-right">
                              <div className="text-xs text-gray-500 line-through">
                                {currencySymbol}{Number(item.price || 0).toFixed(2)}
                              </div>
                              <div className="text-sm font-bold text-blue-600">
                                {currencySymbol}{(Number(item.price || 0) * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {items.length > 5 && (
                    <p className="text-center text-xs font-medium text-blue-600">
                      {t('toolbar.cartMore', { count: items.length - 5 })}
                    </p>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('toolbar.cartItemsLabel')}:</span>
                    <span className="font-medium text-gray-800">
                      {t('toolbar.cartItemsValue', { count: cartCount })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-800">{t('toolbar.cartTotalLabel')}:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {currencySymbol}{items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg" 
                  onClick={handleCartClick}
                >
                  {t('toolbar.viewCart')}
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
            toolbarButtonClass,
            'hover:bg-rose-50',
            wishlistAnimation && 'animate-pulse-subtle',
          )}
          aria-label="心愿单"
        >
          <Heart 
            className={cn(
              'h-5 w-5 transition-all duration-300',
              wishlistCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-700',
              wishlistAnimation && 'scale-125',
            )}
          />
          {wishlistCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-lg',
                wishlistAnimation && 'animate-ping',
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

      {/* 在线客服按钮 */}
      <div className="relative w-16">
        <button
          onClick={() => TawkToAPI.maximize()}
          className={cn(toolbarButtonClass, 'group hover:bg-emerald-50')}
          aria-label="在线客服"
          title="在线客服"
        >
          <div className="relative">
            {/* 使用自定义客服图标 */}
            <MessageCircle className="h-6 w-6 text-green-600 transition-all duration-300 group-hover:scale-110" />
            {/* 在线状态指示器 */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white animate-pulse"></span>
          </div>
        </button>
      </div>

      {/* 返回顶部按钮 - 仅在滚动时显示 */}
      {showScrollTop && (
        <div className="w-16 bg-slate-50/40">
          <button
            onClick={scrollToTop}
            className={cn(toolbarButtonClass, 'animate-fade-in hover:bg-slate-50')}
            aria-label={t('toolbar.tooltip.scrollTop')}
            title={t('toolbar.tooltip.scrollTop')}
          >
            <ArrowUp className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      )}

      {/* 帮助与客服入口 - 底部 */}
      <div className="w-16 bg-slate-50/40">
        <button
          onClick={() => router.push(SUPPORT_HREF)}
          aria-label={t('toolbar.support')}
          title={t('toolbar.support')}
          className={cn(toolbarButtonClass, 'hover:bg-blue-50')}
        >
          <LifeBuoy className="h-6 w-6 text-blue-600" />
        </button>
      </div>
    </div>
  );
}
