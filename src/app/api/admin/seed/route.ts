import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { seedDatabase } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // 检查用户权限（只有管理员可以执行）
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 执行数据库初始化
    const result = await seedDatabase();

    console.log('管理员数据库初始化:', {
      adminId: session.user.id,
      email: session.user.email,
      timestamp: new Date().toISOString(),
      result,
    });

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: result,
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'SEED_FAILED', 
        message: '数据库初始化失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 只允许在开发环境中使用
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'NOT_ALLOWED', message: '仅开发环境可用' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: '数据库种子API可用',
    note: '使用POST请求来初始化数据库',
    requirements: {
      authentication: '需要管理员登录',
      method: 'POST',
      environment: 'development',
    },
  });
}
