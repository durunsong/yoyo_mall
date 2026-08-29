import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const ACTION_TYPES = ['NONE', 'URL', 'OPEN_LOGIN_MODAL', 'OPEN_REGISTER_MODAL'] as const;

const announcementSchema = z.object({
  title: z
    .string({ required_error: '标题长度需在 0-120 字符内' })
    .max(120, '标题过长')
    .optional()
    .nullable(),
  content: z
    .string({ required_error: '内容最长 500 字符' })
    .max(500, '内容过长')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .trim()
    .max(500, '图片地址过长')
    .optional()
    .nullable(),
  backgroundColor: z
    .string()
    .trim()
    .max(32, '背景色长度过长')
    .optional()
    .nullable(),
  textColor: z
    .string()
    .trim()
    .max(32, '文字颜色长度过长')
    .optional()
    .nullable(),
  height: z.coerce.number().int().min(24).max(200).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  actionType: z.enum(ACTION_TYPES).optional(),
  linkUrl: z
    .string()
    .trim()
    .max(500, '链接地址过长')
    .optional()
    .nullable(),
  openInNewTab: z.boolean().optional(),
});

const partialAnnouncementSchema = announcementSchema.partial();

const querySchema = z.object({
  active: z.string().optional(),
  includeConfig: z.string().optional(),
});

async function ensureAnnouncementConfig() {
  return prisma.announcementConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  });
}

function validateActionPayload(data: z.infer<typeof announcementSchema>) {
  const { actionType = 'NONE', linkUrl } = data;

  if (actionType === 'URL' && (!linkUrl || linkUrl.trim().length === 0)) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ['linkUrl'],
        message: '请配置跳转链接或选择其他动作',
      },
    ]);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      active: searchParams.get('active') ?? undefined,
      includeConfig: searchParams.get('includeConfig') ?? undefined,
    });

    const where = query.active === 'true' ? { isActive: true } : {};

    let announcements;
    try {
      announcements = await prisma.announcement.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
      });
    } catch (error) {
      console.warn('[announcements] Falling back to an empty public feed:', error);
      return NextResponse.json({
        success: true,
        data: [],
        config: null,
        meta: { total: 0 },
      });
    }

    let config = null;

    if (query.includeConfig === 'true') {
      try {
        config = await ensureAnnouncementConfig();
      } catch (error) {
        console.warn('[announcements] Falling back to default announcement config:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: announcements,
      config,
      meta: {
        total: announcements.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '请求参数无效',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('公告查询失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = announcementSchema.parse(body);
    validateActionPayload(payload);

    const announcement = await prisma.announcement.create({
      data: {
        title: payload.title?.trim() || null,
        content: payload.content?.trim() || null,
        imageUrl: payload.imageUrl?.trim() || null,
        backgroundColor: payload.backgroundColor?.trim() || null,
        textColor: payload.textColor?.trim() || null,
        height: payload.height ?? null,
        isActive: payload.isActive ?? true,
        sortOrder: payload.sortOrder ?? 0,
        actionType: payload.actionType ?? 'NONE',
        linkUrl:
          payload.actionType === 'URL' && payload.linkUrl
            ? payload.linkUrl.trim()
            : null,
        openInNewTab: payload.actionType === 'URL' ? payload.openInNewTab ?? false : false,
      },
    });

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
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

    console.error('创建公告失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

