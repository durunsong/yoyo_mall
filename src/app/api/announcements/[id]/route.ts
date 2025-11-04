import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const ACTION_TYPES = ['NONE', 'URL', 'OPEN_LOGIN_MODAL', 'OPEN_REGISTER_MODAL'] as const;

const updateSchema = z.object({
  title: z.string().max(120).optional().nullable(),
  content: z.string().max(500).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  backgroundColor: z.string().trim().max(32).optional().nullable(),
  textColor: z.string().trim().max(32).optional().nullable(),
  height: z.coerce.number().int().min(24).max(200).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  actionType: z.enum(ACTION_TYPES).optional(),
  linkUrl: z.string().trim().max(500).optional().nullable(),
  openInNewTab: z.boolean().optional(),
});

const paramsSchema = z.object({
  id: z.string().min(1),
});

function validateAction(payload: z.infer<typeof updateSchema>) {
  const actionType = payload.actionType;
  const linkUrl = payload.linkUrl;

  if (actionType === 'URL') {
    const finalUrl = linkUrl ?? undefined;
    if (!finalUrl || finalUrl.trim().length === 0) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['linkUrl'],
          message: '请配置跳转链接或选择其他动作',
        },
      ]);
    }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = paramsSchema.parse(await params);

    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: '公告不存在' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: '请求参数无效', details: error.errors },
        { status: 400 },
      );
    }

    console.error('获取公告失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = paramsSchema.parse(await params);
    const body = await request.json();
    const payload = updateSchema.parse(body);

    const existing = await prisma.announcement.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: '公告不存在' },
        { status: 404 },
      );
    }

    validateAction(payload);

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title?.trim() || null } : {}),
        ...(payload.content !== undefined ? { content: payload.content?.trim() || null } : {}),
        ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl?.trim() || null } : {}),
        ...(payload.backgroundColor !== undefined
          ? { backgroundColor: payload.backgroundColor?.trim() || null }
          : {}),
        ...(payload.textColor !== undefined
          ? { textColor: payload.textColor?.trim() || null }
          : {}),
        ...(payload.height !== undefined ? { height: payload.height ?? null } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
        ...(payload.actionType !== undefined ? { actionType: payload.actionType } : {}),
        ...(payload.actionType === 'URL'
          ? { linkUrl: payload.linkUrl?.trim() || null, openInNewTab: payload.openInNewTab ?? false }
          : payload.linkUrl !== undefined
            ? { linkUrl: null, openInNewTab: false }
            : {}),
      },
    });

    return NextResponse.json({ success: true, data: announcement });
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

    console.error('更新公告失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = paramsSchema.parse(await params);

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true, message: '公告已删除' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: '请求参数无效', details: error.errors },
        { status: 400 },
      );
    }

    console.error('删除公告失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

