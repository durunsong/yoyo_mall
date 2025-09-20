'use client';

import { usePathname } from 'next/navigation';
import { ShadcnHeader } from './shadcn-header';
import { Footer } from './footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // 检查是否是管理后台路径
  const isAdminRoute = pathname.startsWith('/admin');
  
  // 如果是管理后台路径，直接渲染子组件（不包含前台头部和底部）
  if (isAdminRoute) {
    return <>{children}</>;
  }
  
  // 如果是前台路径，使用完整的前台布局
  return (
    <div className="relative flex min-h-screen flex-col">
      <ShadcnHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
