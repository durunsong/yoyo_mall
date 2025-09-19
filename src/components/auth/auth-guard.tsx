'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo]);

  if (status === 'loading') {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      )
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}

interface AdminGuardProps extends AuthGuardProps {
  allowedRoles?: string[];
}

export function AdminGuard({ 
  children, 
  allowedRoles = ['ADMIN', 'SUPER_ADMIN'],
  fallback,
  redirectTo = '/unauthorized'
}: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role) {
      if (!allowedRoles.includes(session.user.role)) {
        router.push(redirectTo);
      }
    }
  }, [status, session, router, allowedRoles, redirectTo]);

  if (status === 'loading') {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      )
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (session?.user?.role && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
