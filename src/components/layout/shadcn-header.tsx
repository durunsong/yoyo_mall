/**
 * shadcn/ui Header组件
 * 网站顶部导航栏，使用shadcn/ui组件
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Menu, Bell, ShoppingCart, Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';

import { AuthModalShadcn } from '@/components/auth/auth-modal-shadcn';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useSession, signOut } from 'next-auth/react';
import { useStaticTranslations } from '@/hooks/use-i18n';
import ProductSearch from '@/components/products/product-search';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { UserNotifications } from '@/components/layout/user-notifications';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { toast } from 'sonner';
import { TawkToAPI } from '@/components/chat/tawk-to-widget';
import { MessageCircle } from 'lucide-react';

// 导航菜单配置（去掉 Home，Logo 已可回到首页）
const getNavItems = (t: (key: string) => string) => [
  { key: '/products', label: t('products'), href: '/products' },
  { key: '/categories', label: t('categories'), href: '/categories' },
  { key: '/deals', label: t('deals'), href: '/deals' },
  // Admin 链接在渲染时按权限过滤
  { key: '/admin', label: t('admin'), href: '/admin' },
];

export function ShadcnHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // 移动端搜索状态
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, defaultTab, openModal, closeModal } = useAuthModal();
  const { data: session } = useSession();
  // 使用 navigation 命名空间渲染导航文案，使用 common 渲染通用文案
  const { t: tNav } = useStaticTranslations('navigation');
  const { t: tCommon } = useStaticTranslations('common');

  // 获取购物车和心愿单数据
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  
  // 计算购物车商品总数量
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  // 获取翻译后的导航项
  const navItems = getNavItems(tNav);

  // 处理心愿单点击
  const handleWishlistClick = () => {
    if (!session) {
      toast.error(tCommon('loginRequired') || '请先登录后查看心愿单');
      openModal('login');
      return;
    }
    router.push('/account/wishlist');
  };

  // 处理Discord点击
  const handleDiscordClick = () => {
    toast.info('Discord功能即将上线，敬请期待！');
  };

  // 处理客服点击
  const handleCustomerServiceClick = () => {
    TawkToAPI.maximize();
  };

  // 处理登出
  // const handleLogout = () => {};

  return (
    <>
      {/* 公告栏 */}
      <AnnouncementBar />

      {/* 主导航栏 */}
      <header className="sticky top-0 z-50 w-full bg-background/95 shadow-[0_4px_10px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/icons/web-logo.svg"
                  alt="Yobuy"
                  width={160}
                  height={50}
                  priority
                  className="h-8 w-auto"
                />
                <span className="sr-only">Yobuy</span>
              </Link>
            </div>

            {/* 桌面端导航菜单 */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                    {navItems
                      .filter((item) => {
                        const role = (session?.user as { role?: string } | undefined)?.role;
                        return item.href !== '/admin' ? true : role === 'ADMIN' || role === 'SUPER_ADMIN';
                      })
                      .map((item) => (
                      <NavigationMenuItem key={item.key}>
                        <NavigationMenuLink asChild>
                          {item.href === '/admin' ? (
                            <button
                              onClick={() => window.open('/admin', '_blank')}
                              className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                                pathname === item.href ? 'bg-accent text-accent-foreground' : 'bg-background'
                              }`}
                            >
                              {item.label}
                            </button>
                          ) : (
                            <Link 
                              href={item.href}
                              className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                                pathname === item.href ? 'bg-accent text-accent-foreground' : 'bg-background'
                              }`}
                            >
                              {item.label}
                            </Link>
                          )}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* 搜索框 - 桌面端 */}
            <div className="mx-8 hidden max-w-md flex-1 lg:block">
              <ProductSearch placeholder={tNav('searchPlaceholder')} />
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center space-x-2">
              {/* 搜索按钮 - 移动端 */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* 购物车按钮 - 在移动端显示 */}
              <Button
                variant="ghost"
                size="icon"
                className="relative md:hidden"
                asChild
              >
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 min-w-4 justify-center p-0 text-[10px]"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* 心愿单按钮 - 在移动端显示 */}
              <Button
                variant="ghost"
                size="icon"
                className="relative md:hidden"
                onClick={handleWishlistClick}
              >
                <Heart 
                  className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} 
                />
                {wishlistCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 min-w-4 justify-center p-0 text-[10px]"
                  >
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </Badge>
                )}
              </Button>

              {/* 语言切换 - 仅桌面端显示 */}
              <div className="hidden md:block">
                <LanguageSwitcher mode="select" />
              </div>

              {/* 通知 - 仅登录用户显示 */}
              <UserNotifications />

              {/* 用户菜单 */}
              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:flex border-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage
                          key={(session.user as any).avatar || (session.user as any).image || Date.now()}
                          src={(session.user as any).avatar || (session.user as any).image || '/avatars/default-avatar.svg'}
                          alt={session.user.name || 'User Avatar'}
                        />
                        <AvatarFallback>{(session.user?.name || 'U').slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      {session.user.name || session.user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/account')}>{tNav('profile')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/account/orders')}>{tNav('orders')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({ 
                      callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/', 
                    })}>{tCommon('logout')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => openModal('login')} className="hidden sm:flex">
                  <User className="mr-2 h-4 w-4" />
                  {tCommon('login')}
                </Button>
              )}

              {/* 移动端菜单按钮 */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>{tNav('menu')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {/* 购物车和心愿单快捷按钮 */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="relative flex-1 justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push('/cart');
                        }}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {tNav('cart')}
                        {cartCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 min-w-5 justify-center p-0 text-xs"
                          >
                            {cartCount}
                          </Badge>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="relative flex-1 justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleWishlistClick();
                        }}
                      >
                        <Heart className={`mr-2 h-4 w-4 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                        {tNav('wishlist')}
                        {wishlistCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 min-w-5 justify-center p-0 text-xs"
                          >
                            {wishlistCount}
                          </Badge>
                        )}
                      </Button>
                    </div>

                    <Separator />

                    {/* 导航菜单 */}
                    <nav className="space-y-2">
                      {navItems
                        .filter((item) => {
                          const role = (session?.user as { role?: string } | undefined)?.role;
                          return item.href !== '/admin' ? true : role === 'ADMIN' || role === 'SUPER_ADMIN';
                        })
                        .map((item) => 
                            item.href === '/admin' ? (
                              <button
                                key={item.key}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  window.open('/admin', '_blank');
                                }}
                                className={`block w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                                  pathname === item.href ? 'bg-accent text-accent-foreground' : ''
                                }`}
                              >
                                {item.label}
                              </button>
                            ) : (
                              <Link
                                key={item.key}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                                  pathname === item.href ? 'bg-accent text-accent-foreground' : ''
                                }`}
                              >
                                {item.label}
                              </Link>
                            ),
                      )}
                    </nav>

                    <Separator />

                    {/* 客服、Discord 和语言切换 */}
                    <div className="space-y-2">
                      {/* 在线客服按钮 */}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleCustomerServiceClick();
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                        在线客服
                      </Button>

                      {/* Discord按钮 */}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleDiscordClick();
                        }}
                      >
                        <svg className="mr-2 h-4 w-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Discord
                      </Button>

                      {/* 语言切换 */}
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">语言 / Language</span>
                        <LanguageSwitcher mode="select" />
                      </div>
                    </div>

                    <Separator />

                    {/* 其他操作 */}
                    <div className="space-y-2">
                      {session?.user ? (
                        <>
                          {/* 用户信息 */}
                          <div className="flex items-center gap-3 px-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                key={(session.user as any).avatar || (session.user as any).image || Date.now()}
                                src={(session.user as any).avatar || (session.user as any).image || '/avatars/default-avatar.svg'} 
                              />
                              <AvatarFallback>{(session.user?.name || 'U').slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <p className="font-medium leading-none">{session.user.name || session.user.email}</p>
                              {session.user.email && (
                                <p className="text-xs text-muted-foreground">{session.user.email}</p>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              router.push('/account');
                            }}
                          >
                            <User className="mr-2 h-4 w-4" />
                            {tNav('profile')}
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              signOut({ 
                                callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/', 
                              });
                            }}
                          >
                            {tCommon('logout')}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            openModal('login');
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          {tCommon('login')}/{tCommon('register')}
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* 移动端搜索框 - 在header内部，点击搜索按钮后显示 */}
          {mobileSearchOpen && (
            <div className="border-t border-gray-200 px-4 py-3 lg:hidden">
              <ProductSearch 
                placeholder={tNav('searchPlaceholder')} 
                onSearch={() => setMobileSearchOpen(false)} 
              />
            </div>
          )}
        </div>
      </header>

          {/* 认证弹窗 */}
          <AuthModalShadcn open={isOpen} onClose={closeModal} defaultTab={defaultTab} />
    </>
  );
}
