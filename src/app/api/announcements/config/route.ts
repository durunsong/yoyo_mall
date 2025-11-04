import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const configSchema = z.object({
  rotationInterval: z.coerce.number().int().min(1000).max(60000),
});

async function getConfig() {
  return prisma.announcementConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  });
}

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ success: true, data: config });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rotationInterval } = configSchema.parse(body);

    const config = await prisma.announcementConfig.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        rotationInterval,
      },
      update: {
        rotationInterval,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('更新公告配置失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

