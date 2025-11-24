'use client';

/**
 * 登录/权限守卫
 * - 可选自动弹出登录弹窗
 * - 支持按角色控制可见性
 */

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { useAuthModal, type AuthModalTab } from '@/hooks/use-auth-modal';

interface AuthGuardProps {
  children: ReactNode;
  /** 自定义未登录 / 无权限占位 */
  fallback?: ReactNode;
  /** 是否自动打开弹窗 */
  autoOpenModal?: boolean;
  /** 默认打开的页签 */
  defaultTab?: AuthModalTab;
  /** 限定可访问角色，不传则仅要求登录 */
  allowedRoles?: string[];
}

const defaultSkeleton = (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-muted-foreground">
    <ShieldAlert className="h-5 w-5" />
    <p className="text-sm">正在确认您的身份...</p>
  </div>
);

export function AuthGuard({
  children,
  fallback,
  autoOpenModal = true,
  defaultTab = 'login',
  allowedRoles,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const { isOpen, defaultTab: modalTab, openModal, closeModal } = useAuthModal();

  // 未登录时可自动打开登录弹窗，避免用户不知所措
  useEffect(() => {
    if (!autoOpenModal || status !== 'unauthenticated') {
      return;
    }
    openModal(defaultTab);
  }, [autoOpenModal, defaultTab, openModal, status]);

  const userRole = session?.user?.role;
  const hasUser = Boolean(session?.user);
  const roleAllowed =
    !allowedRoles || allowedRoles.length === 0 || (userRole ? allowedRoles.includes(userRole) : false);
  const isAuthorized = hasUser && roleAllowed;

  const fallbackView = fallback ?? (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-8 text-center">
      <ShieldAlert className="h-10 w-10 text-amber-500" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          {hasUser ? '当前账号没有访问权限' : '该操作需要登录'}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasUser ? '请使用具有更高权限的账号登录' : '登录后即可继续。我们会自动带您回到当前页面'}
        </p>
      </div>
      {!hasUser && (
        <Button onClick={() => openModal(defaultTab)} className="w-full sm:w-auto">
          立即登录
        </Button>
      )}
    </div>
  );

  if (status === 'loading') {
    return defaultSkeleton;
  }

  if (!isAuthorized) {
    return (
      <>
        {fallbackView}
        <AuthModal open={isOpen} onClose={closeModal} defaultTab={modalTab} />
      </>
    );
  }

  return (
    <>
      {children}
      <AuthModal open={isOpen} onClose={closeModal} defaultTab={modalTab} />
    </>
  );
}

interface AdminGuardProps extends Omit<AuthGuardProps, 'allowedRoles'> {
  /** 是否允许普通管理员以外的其它角色，默认允许 SUPER_ADMIN */
  extraRoles?: string[];
}

export function AdminGuard({ extraRoles = ['SUPER_ADMIN'], ...rest }: AdminGuardProps) {
  const allowedRoles = ['ADMIN', ...extraRoles];
  return <AuthGuard {...rest} allowedRoles={allowedRoles} />;
}

