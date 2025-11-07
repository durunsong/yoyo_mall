import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * 测试 API - 用于调试 auth() 函数
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      debug: {
        hasSession: !!session,
        session: session,
        user: session?.user,
        role: (session?.user as any)?.role,
        roleType: typeof (session?.user as any)?.role,
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

