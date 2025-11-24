/**
 * 管理后台 - 数据分析API
 * 提供销售数据、用户统计、商品分析等
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - 获取数据分析统计
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    // 检查是否有管理员权限（ADMIN 或 SUPER_ADMIN）
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 },
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // 默认30天
    const days = parseInt(period);

    // 计算日期范围
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // 并行查询所有统计数据
    const [
      // 总览统计
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      
      // 状态统计
      pendingOrders,
      processingOrders,
      completedOrders,
      
      // 趋势数据（最近N天）
      recentOrders,
      recentUsers,
      
      // 热门商品
      topProducts,
      
      // 最近订单
      latestOrders,
    ] = await Promise.all([
      // 总订单数
      prisma.order.count(),
      
      // 总营收（只统计已完成订单）
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      
      // 总用户数（排除管理员）
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
        },
      }),
      
      // 总商品数
      prisma.product.count(),
      
      // 待处理订单
      prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),
      
      // 处理中订单
      prisma.order.count({
        where: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
        },
      }),
      
      // 已完成订单
      prisma.order.count({
        where: {
          status: 'DELIVERED',
        },
      }),
      
      // 最近N天的订单（按天分组）
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      
      // 最近N天的新用户
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          createdAt: true,
        },
      }),
      
      // 热门商品（按订单数量排序）
      prisma.orderItem.groupBy({
        by: ['productId'],
        _count: {
          productId: true,
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _count: {
            productId: 'desc',
          },
        },
        take: 10,
      }),
      
      // 最近10个订单
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // 处理趋势数据：按天分组统计
    const ordersChart: { [key: string]: { count: number; revenue: number } } = {};
    const usersChart: { [key: string]: number } = {};

    // 初始化所有日期
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      ordersChart[dateKey] = { count: 0, revenue: 0 };
      usersChart[dateKey] = 0;
    }

    // 统计订单数据
    recentOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (ordersChart[dateKey]) {
        ordersChart[dateKey].count++;
        if (order.status === 'DELIVERED') {
          ordersChart[dateKey].revenue += Number(order.totalAmount);
        }
      }
    });

    // 统计用户数据
    recentUsers.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      if (usersChart[dateKey]) {
        usersChart[dateKey]++;
      }
    });

    // 转换为数组格式，按日期排序
    const ordersChartData = Object.keys(ordersChart)
      .sort()
      .map((date) => ({
        date,
        count: ordersChart[date].count,
        revenue: ordersChart[date].revenue,
      }));

    const usersChartData = Object.keys(usersChart)
      .sort()
      .map((date) => ({
        date,
        count: usersChart[date],
      }));

    // 获取热门商品详情
    const topProductIds = topProducts
      .map((p) => p.productId)
      .filter((id): id is string => Boolean(id));
    const topProductsDetails = topProductIds.length
      ? await prisma.product.findMany({
          where: {
            id: {
              in: topProductIds,
            },
          },
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              select: {
                url: true,
              },
              take: 1,
              orderBy: { sortOrder: 'asc' },
            },
          },
        })
      : [];

    // 合并热门商品数据
    const topProductsData = topProducts.map((p) => {
      const product = topProductsDetails.find((pd) => pd.id === p.productId);
      return {
        id: p.productId,
        name: product?.name || '未知商品',
        price: product?.price || 0,
        image: product?.images[0]?.url || null,
        orderCount: p._count.productId,
        totalQuantity: p._sum.quantity || 0,
      };
    });

    // 计算同比增长（与上一个周期对比）
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    
    const [previousOrders, previousUsers, previousRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
          role: 'CUSTOMER',
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
          status: 'DELIVERED',
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // 计算增长率
    const currentPeriodOrders = recentOrders.length;
    const currentPeriodUsers = recentUsers.length;
    const currentPeriodRevenue = recentOrders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const ordersGrowth = previousOrders > 0 
      ? ((currentPeriodOrders - previousOrders) / previousOrders) * 100 
      : 0;
    const usersGrowth = previousUsers > 0 
      ? ((currentPeriodUsers - previousUsers) / previousUsers) * 100 
      : 0;
    const revenueGrowth = previousRevenue._sum.totalAmount 
      ? ((currentPeriodRevenue - Number(previousRevenue._sum.totalAmount)) / Number(previousRevenue._sum.totalAmount)) * 100 
      : 0;

    // 返回统计数据
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
          totalUsers,
          totalProducts,
          pendingOrders,
          processingOrders,
          completedOrders,
          ordersGrowth: Number(ordersGrowth.toFixed(2)),
          usersGrowth: Number(usersGrowth.toFixed(2)),
          revenueGrowth: Number(revenueGrowth.toFixed(2)),
        },
        charts: {
          orders: ordersChartData,
          users: usersChartData,
        },
        topProducts: topProductsData,
        latestOrders,
      },
    });
  } catch (error) {
    console.error('获取数据分析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '获取数据分析失败';
    return NextResponse.json(
      { 
        success: false, 
        error: '获取数据分析失败',
        details: errorMessage, 
      },
      { status: 500 },
    );
  }
}


