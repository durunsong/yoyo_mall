'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStaticTranslations } from '@/hooks/use-i18n';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// 管理后台导航菜单
const adminNavItems = [
  {
    key: 'dashboard',
    label: '仪表板',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    key: 'products',
    label: '商品管理',
    href: '/admin/products',
    icon: Package,
  },
  {
    key: 'orders',
    label: '订单管理',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    key: 'users',
    label: '用户管理',
    href: '/admin/users',
    icon: Users,
  },
  {
    key: 'analytics',
    label: '数据分析',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    key: 'settings',
    label: '系统设置',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useStaticTranslations('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleBackToFrontend = () => {
    window.open('/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
              <span className="text-lg font-bold text-white">Y</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">管理后台</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 导航菜单 */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 侧边栏底部 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="outline"
            onClick={handleBackToFrontend}
            className="w-full justify-start"
          >
            <Package className="mr-2 h-4 w-4" />
            返回前台
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            {/* 左侧：移动端菜单按钮 */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              {/* 搜索框 */}
              <div className="hidden md:block ml-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {/* 右侧：通知和用户菜单 */}
            <div className="flex items-center space-x-4">
              {/* 通知 */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* 用户菜单 */}
              {session?.user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={(session.user as any).image || "/avatars/default-avatar.svg"} 
                          alt={session.user.name || "Admin"} 
                        />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                        <p className="text-xs leading-none text-blue-600">
                          {session.user.role === 'SUPER_ADMIN' ? '超级管理员' : '管理员'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open('/account', '_blank')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>个人设置</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
