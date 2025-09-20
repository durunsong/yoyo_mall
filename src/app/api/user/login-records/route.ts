import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// 获取用户登录记录
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '未授权访问' },
        { status: 401 }
      );
    }

    // 返回最近20条登录记录
    try {
      const loginRecords = await prisma.loginRecord.findMany({
        where: { userId: session.user.id },
        orderBy: { loginTime: 'desc' },
        take: 20,
        select: {
          id: true,
          loginTime: true,
          ipAddress: true,
          userAgent: true,
          location: true,
        },
      });
      return NextResponse.json(loginRecords);
    } catch (err: any) {
      // 若表未创建（开发环境未迁移），降级为空数组，避免前端报错
      const msg = typeof err?.message === 'string' ? err.message : '';
      if (err?.code === 'P2021' || msg.includes('does not exist')) {
        console.warn('login_records 表不存在，返回空列表（请运行 Prisma 迁移）');
        return NextResponse.json([]);
      }
      throw err;
    }

  } catch (error) {
    console.error('获取登录记录错误:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 记录新的登录
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '未授权访问' },
        { status: 401 }
      );
    }

    // 从请求头自动提取 IP/UA
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIp = request.headers.get('x-real-ip') || '';
    const ipAddress = (forwardedFor.split(',')[0] || realIp || '').trim();
    const userAgent = request.headers.get('user-agent') || '';
    const location = '';

    // 创建登录记录
    const loginRecord = await prisma.loginRecord.create({
      data: {
        userId: session.user.id,
        ipAddress,
        userAgent,
        location,
        loginTime: new Date(),
      },
    });

    console.log('登录记录创建成功:', {
      userId: session.user.id,
      ipAddress,
      loginTime: loginRecord.loginTime,
    });

    return NextResponse.json({
      success: true,
      message: '登录记录创建成功',
      record: loginRecord,
    });

  } catch (error) {
    console.error('创建登录记录错误:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
