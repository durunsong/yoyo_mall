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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="hidden md:block bg-gray-50 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm text-gray-600">
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
              <Globe className="w-4 h-4" />
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
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">Y</span>
              </div>
              <span className="hidden sm:block text-xl font-bold">YOYO Mall</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
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
          <div className="hidden lg:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="搜索商品..."
                className="pl-10 pr-4"
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
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </Button>

            {/* User Menu */}
            <Button variant="ghost" size="icon" onClick={() => openModal('login')}>
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
          <div className="lg:hidden py-4 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="搜索商品..."
                className="pl-10 pr-4"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary px-2 py-1',
                    pathname === item.href
                      ? 'text-foreground bg-accent rounded-md'
                      : 'text-foreground/60',
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3">
                <button
                  className="text-sm font-medium text-foreground/60 hover:text-primary px-2 py-1 block w-full text-left"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openModal('login');
                  }}
                >
                  登录
                </button>
                <button
                  className="text-sm font-medium text-foreground/60 hover:text-primary px-2 py-1 block w-full text-left"
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
      <AuthModal 
        open={isOpen}
        onClose={closeModal}
        defaultTab={defaultTab}
      />
    </header>
  );
}
