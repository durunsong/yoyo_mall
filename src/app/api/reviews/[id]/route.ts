/**
 * 单个评价管理API
 * 更新和删除评价
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * 更新评价验证schema
 */
const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

/**
 * PATCH - 更新评价
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id: reviewId } = await params;
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 },
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    // 获取评价
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: '评价不存在' },
        { status: 404 },
      );
    }

    // 检查权限（只能编辑自己的评价或管理员）
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '无权限修改该评价' },
        { status: 403 },
      );
    }

    // 解析请求体
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    // 更新评价
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(validatedData.rating && { rating: validatedData.rating }),
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.images && { images: validatedData.images }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    console.log('评价更新成功:', {
      reviewId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: '评价更新成功',
      data: updatedReview,
    });
  } catch (error) {
    console.error('更新评价失败:', error);

    // Zod验证错误
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

    return NextResponse.json(
      { success: false, error: '更新评价失败' },
      { status: 500 },
    );
  }
}

/**
 * DELETE - 删除评价
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id: reviewId } = await params;
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 },
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    // 获取评价
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: '评价不存在' },
        { status: 404 },
      );
    }

    // 检查权限（只能删除自己的评价或管理员）
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '无权限删除该评价' },
        { status: 403 },
      );
    }

    // 删除评价
    await prisma.review.delete({
      where: { id: reviewId },
    });

    console.log('评价删除成功:', {
      reviewId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: '评价删除成功',
    });
  } catch (error) {
    console.error('删除评价失败:', error);
    return NextResponse.json(
      { success: false, error: '删除评价失败' },
      { status: 500 },
    );
  }
}


