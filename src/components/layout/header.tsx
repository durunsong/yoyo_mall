/**
 * Header组件
 * 网站顶部导航栏，包含logo、菜单、搜索、用户操作等
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ShoppingCart, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuthModal } from '@/hooks/use-auth-modal';

// 导航菜单配置
const navigation = [
  { name: '首页', href: '/' },
  { name: '商品', href: '/products' },
  { name: '分类', href: '/categories' },
  { name: '品牌', href: '/brands' },
  { name: '优惠', href: '/deals' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { isOpen, defaultTab, openModal, closeModal } = useAuthModal();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      {/* Top Bar */}
      <div className="hidden bg-gray-50 py-2 md:block">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>免费配送满$99</span>
            <span>•</span>
            <span>7天无理由退货</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/help" className="hover:text-gray-900">
              客服中心
            </Link>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <span>中文</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'hover:text-primary text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-foreground/60',
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="mx-6 hidden max-w-sm flex-1 lg:flex">
            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="搜索商品..."
                className="pr-4 pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  0
                </span>
              </Link>
            </Button>

            {/* User Menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openModal('login')}
            >
              <User className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="border-t py-4 lg:hidden">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="搜索商品..."
                className="pr-4 pl-10"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <nav className="flex flex-col space-y-3">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'hover:text-primary px-2 py-1 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-foreground bg-accent rounded-md'
                      : 'text-foreground/60',
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-3 border-t pt-3">
                <button
                  className="text-foreground/60 hover:text-primary block w-full px-2 py-1 text-left text-sm font-medium"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openModal('login');
                  }}
                >
                  登录
                </button>
                <button
                  className="text-foreground/60 hover:text-primary block w-full px-2 py-1 text-left text-sm font-medium"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openModal('register');
                  }}
                >
                  注册
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* 认证弹窗 */}
      <AuthModal open={isOpen} onClose={closeModal} defaultTab={defaultTab} />
    </header>
  );
}
