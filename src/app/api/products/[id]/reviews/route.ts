/**
 * 商品评价API
 * 获取商品的所有评价和创建新评价
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * 创建评价验证schema
 */
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

/**
 * GET - 获取商品评价列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 构建筛选条件
    const where: any = {
      productId,
      isPublished: true,
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询评价列表
    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      // 获取评分统计
      prisma.review.groupBy({
        by: ['rating'],
        where: {
          productId,
          isPublished: true,
        },
        _count: {
          rating: true,
        },
      }),
    ]);

    // 计算平均评分
    const allReviews = await prisma.review.findMany({
      where: {
        productId,
        isPublished: true,
      },
      select: {
        rating: true,
      },
    });

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    // 统计各星级数量
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    stats.forEach((stat) => {
      ratingDistribution[stat.rating as keyof typeof ratingDistribution] = stat._count.rating;
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
        statistics: {
          averageRating: Number(averageRating.toFixed(1)),
          totalReviews: allReviews.length,
          ratingDistribution,
        },
      },
    });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取评价列表失败' },
      { status: 500 },
    );
  }
}

/**
 * POST - 创建商品评价
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 },
      );
    }

    // 验证商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 },
      );
    }

    // 检查用户是否已经评价过
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: '您已经评价过该商品' },
        { status: 400 },
      );
    }

    // 检查用户是否购买过该商品
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
          status: 'DELIVERED',
        },
      },
    });

    // 解析请求体
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // 创建评价
    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content,
        images: validatedData.images || [],
        isVerified: !!hasPurchased, // 购买过的用户标记为已验证
        isPublished: true,
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

    console.log('用户创建评价:', {
      userId: user.id,
      productId,
      reviewId: review.id,
      rating: review.rating,
    });

    return NextResponse.json({
      success: true,
      message: '评价发表成功',
      data: review,
    });
  } catch (error) {
    console.error('创建评价失败:', error);

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
      { success: false, error: '创建评价失败' },
      { status: 500 },
    );
  }
}


