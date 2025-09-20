import { auth } from '@/app/api/auth/[...nextauth]/route';

export function isAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 });
  }
  const role = (session.user as any)?.role as string | undefined;
  if (!isAdmin(role)) {
    throw Object.assign(new Error('FORBIDDEN'), { status: 403 });
  }
  return session;
}


