/**
 * shadcn/ui Header组件
 * 网站顶部导航栏，使用shadcn/ui组件
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, Bell } from 'lucide-react';

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
import ShoppingCartBadge from './shopping-cart-badge';
import ProductSearch from '@/components/products/product-search';
import LanguageSwitcher from '@/components/ui/language-switcher';

// 导航菜单配置（去掉 Home，Logo 已可回到首页）
const getNavItems = (t: (key: string) => string) => [
  { key: '/products', label: t('products'), href: '/products' },
  { key: '/categories', label: t('categories'), href: '/categories' },
  { key: '/brands', label: t('brands'), href: '/brands' },
  { key: '/deals', label: t('deals'), href: '/deals' },
  // Admin 链接在渲染时按权限过滤
  { key: '/admin', label: t('admin'), href: '/admin' },
];

export function ShadcnHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, defaultTab, openModal, closeModal } = useAuthModal();
  const { data: session } = useSession();
  // 使用 navigation 命名空间渲染导航文案，使用 common 渲染通用文案
  const { t: tNav } = useStaticTranslations('navigation');
  const { t: tCommon } = useStaticTranslations('common');

  // 获取翻译后的导航项
  const navItems = getNavItems(tNav);

  // 处理登出
  // const handleLogout = () => {};

  return (
    <>
      {/* 顶部通知栏 */}
      <div className="bg-blue-600 py-1 text-center text-sm text-white">
        <div className="flex justify-center space-x-8">
          <span>{tCommon('freeShipping')}</span>
          <span>{tCommon('sevenDayReturns')}</span>
          <span>{tCommon('twentyFourSupport')}</span>
        </div>
      </div>

      {/* 主导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                  <span className="text-xl font-bold text-white">Y</span>
                </div>
                <span className="hidden text-xl font-bold sm:block">
                  YOYO Mall
                </span>
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
                onClick={() => {
                  // TODO: 显示移动端搜索框
                }}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* 语言切换 */}
              <LanguageSwitcher mode="select" />

              {/* 通知 */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* 购物车 */}
              <ShoppingCartBadge />

              {/* 用户菜单 */}
              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage
                          key={(session.user as any).image || 'default-avatar'}
                          src={(session.user as any).image || '/avatars/default-avatar.svg'}
                          alt={session.user.name || 'User Avatar'}
                        />
                        <AvatarFallback>{(session.user?.name || 'U').slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      {session.user.name || session.user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/account')}>{tNav('profile')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>{tNav('orders')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>{tCommon('logout')}</DropdownMenuItem>
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
                    {/* 搜索框 */}
                    <ProductSearch placeholder={tNav('searchPlaceholder')} />

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
                            )
                      )}
                    </nav>

                    <Separator />

                    {/* 其他操作 */}
                    <div className="space-y-2">
                      {session?.user ? (
                        <>
                          {/* 用户信息 */}
                          <div className="flex items-center gap-3 px-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={(session.user as any).image || '/avatars/default-avatar.svg'} />
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
                              signOut({ callbackUrl: '/' });
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

                      <Button className="w-full justify-start">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {tNav('cart')}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

          {/* 认证弹窗 */}
          <AuthModalShadcn open={isOpen} onClose={closeModal} defaultTab={defaultTab} />
    </>
  );
}
