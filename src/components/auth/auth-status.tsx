'use client';

/**
 * 认证状态展示组件
 * - 集中管理加载、未登录、已登录三种状态
 * - 避免不同页面反复编写相同的 session 判断逻辑
 */

import type { ReactNode } from 'react';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface AuthStatusProps {
  /** 自定义加载占位 */
  loadingFallback?: ReactNode;
  /** 未登录时展示的占位，也可以传入按钮等互动元素 */
  unauthenticatedFallback?: ReactNode;
  /** 需要渲染的内容，支持 render props 形式 */
  children?: ReactNode | ((session: Session) => ReactNode);
}

export function AuthStatus({
  loadingFallback,
  unauthenticatedFallback,
  children,
}: AuthStatusProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        {loadingFallback ?? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>正在验证身份...</span>
          </>
        )}
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {unauthenticatedFallback ?? <span>请先登录以继续操作</span>}
      </div>
    );
  }

  if (typeof children === 'function') {
    return <>{children(session)}</>;
  }

  return <>{children}</>;
}

