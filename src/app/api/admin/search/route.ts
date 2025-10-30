import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * 后台全局搜索 API
 * GET /api/admin/search?q=搜索关键词
 * 
 * 功能:
 * - 搜索商品(名称、SKU、描述)
 * - 搜索订单(订单号、用户名)
 * - 搜索用户(姓名、邮箱)
 * - 返回统一格式的搜索结果
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 },
      );
    }

    // 获取搜索关键词
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    // 并行搜索商品、订单、用户
    const [products, orders, users] = await Promise.all([
      // 搜索商品
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
        },
        take: 5,
      }),

      // 搜索订单
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: 5,
      }),

      // 搜索用户
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        take: 5,
      }),
    ]);

    // 格式化搜索结果
    const results = [
      // 商品结果
      ...products.map((product) => ({
        id: product.id,
        type: 'product' as const,
        title: product.name,
        subtitle: `SKU: ${product.sku} | 价格: $${Number(product.price).toFixed(2)}`,
        url: `/admin/products?id=${product.id}`,
      })),

      // 订单结果
      ...orders.map((order) => ({
        id: order.id,
        type: 'order' as const,
        title: order.orderNumber,
        subtitle: `${order.user.name || order.user.email} | $${Number(order.totalAmount).toFixed(2)} | ${getOrderStatusText(order.status)}`,
        url: `/admin/orders?id=${order.id}`,
      })),

      // 用户结果
      ...users.map((user) => ({
        id: user.id,
        type: 'user' as const,
        title: user.name || user.email,
        subtitle: `${user.email} | ${getRoleText(user.role)}`,
        url: `/admin/users?id=${user.id}`,
      })),
    ];

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败' },
      { status: 500 },
    );
  }
}

/**
 * 获取订单状态文本
 */
function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: '待处理',
    CONFIRMED: '已确认',
    PROCESSING: '处理中',
    SHIPPED: '已发货',
    DELIVERED: '已送达',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  };
  return statusMap[status] || status;
}

/**
 * 获取角色文本
 */
function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    USER: '普通用户',
    ADMIN: '管理员',
    SUPER_ADMIN: '超级管理员',
  };
  return roleMap[role] || role;
}



