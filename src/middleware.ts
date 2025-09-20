import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function isAdminRole(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  // 允许管理员初始化端点跳过鉴权（内部自校验/仅开发环境或需密钥）
  if (pathname === '/api/admin/create-admin') {
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/_not-found';
    return NextResponse.rewrite(url);
  }

  const role = (token as unknown as { role?: string }).role;
  if (!isAdminRole(role)) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/_not-found';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};


