import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * 后台全局搜索 API
 * GET /api/admin/search?q=搜索关键词
 * 
 * 功能:
 * - 搜索后台页面和功能模块
 * - 搜索系统设置项
 * - 搜索商品(名称、SKU、描述)
 * - 搜索订单(订单号、用户名)
 * - 搜索用户(姓名、邮箱)
 * - 返回统一格式的搜索结果
 */

/**
 * 后台功能页面和模块配置
 * 用于快速导航和搜索
 */
const ADMIN_PAGES = [
  // 主要功能页面
  {
    id: 'dashboard',
    title: '仪表板',
    keywords: ['dashboard', '仪表板', '首页', '概览', '统计'],
    description: '查看系统概览和关键数据',
    url: '/admin',
    type: 'page',
  },
  {
    id: 'products',
    title: '商品管理',
    keywords: ['product', '商品', '商品管理', '商品列表', '产品'],
    description: '管理商品信息、库存和分类',
    url: '/admin/products',
    type: 'page',
  },
  {
    id: 'orders',
    title: '订单管理',
    keywords: ['order', '订单', '订单管理', '订单列表'],
    description: '查看和处理用户订单',
    url: '/admin/orders',
    type: 'page',
  },
  {
    id: 'users',
    title: '用户管理',
    keywords: ['user', '用户', '用户管理', '用户列表', '会员'],
    description: '管理用户账户和权限',
    url: '/admin/users',
    type: 'page',
  },
  {
    id: 'analytics',
    title: '数据分析',
    keywords: ['analytics', '分析', '数据', '报表', '统计'],
    description: '查看销售数据和分析报告',
    url: '/admin/analytics',
    type: 'page',
  },
  {
    id: 'home-config',
    title: '首页配置',
    keywords: ['home', '首页', '首页配置', '轮播', 'banner', '模块'],
    description: '配置首页轮播图和功能模块',
    url: '/admin/home-config',
    type: 'page',
  },
  {
    id: 'footer-config',
    title: 'Footer配置',
    keywords: ['footer', '页脚', 'footer配置', '底部', '链接'],
    description: '配置网站页脚内容和链接',
    url: '/admin/footer-config',
    type: 'page',
  },
  {
    id: 'newsletter',
    title: '邮件订阅',
    keywords: ['newsletter', '邮件', '订阅', '邮件列表', '营销'],
    description: '管理邮件订阅用户',
    url: '/admin/newsletter',
    type: 'page',
  },
  {
    id: 'notifications',
    title: '通知管理',
    keywords: ['notification', '通知', '消息', '提醒'],
    description: '查看和管理系统通知',
    url: '/admin/notifications',
    type: 'page',
  },
  
  // 系统设置相关
  {
    id: 'settings',
    title: '系统设置',
    keywords: ['settings', '设置', '系统设置', '配置'],
    description: '配置系统参数和选项',
    url: '/admin/settings',
    type: 'page',
  },
  {
    id: 'settings-site',
    title: '网站设置',
    keywords: ['网站', '网站设置', 'site', '网站名称', '网站描述', 'SEO'],
    description: '配置网站基本信息和SEO',
    url: '/admin/settings#site',
    type: 'setting',
    parent: '系统设置',
  },
  {
    id: 'settings-payment',
    title: '支付设置',
    keywords: ['支付', '支付设置', 'payment', 'stripe', '支付方式'],
    description: '配置支付方式和参数',
    url: '/admin/settings#payment',
    type: 'setting',
    parent: '系统设置',
  },
  {
    id: 'settings-email',
    title: '邮件设置',
    keywords: ['邮件', '邮件设置', 'email', 'smtp', '邮箱'],
    description: '配置邮件发送服务',
    url: '/admin/settings#email',
    type: 'setting',
    parent: '系统设置',
  },
  {
    id: 'settings-notifications',
    title: '通知设置',
    keywords: ['通知', '通知设置', 'notification', '消息提醒'],
    description: '配置系统通知规则',
    url: '/admin/settings#notifications',
    type: 'setting',
    parent: '系统设置',
  },
  {
    id: 'settings-product-detail',
    title: '商详配置',
    keywords: ['商详', '商品详情', 'product detail', '商品页'],
    description: '配置商品详情页功能',
    url: '/admin/settings#product-detail',
    type: 'setting',
    parent: '系统设置',
  },
  {
    id: 'settings-announcements',
    title: '公告管理',
    keywords: ['公告', '公告栏', 'announcement', '通知栏'],
    description: '配置网站公告栏',
    url: '/admin/settings#announcements',
    type: 'setting',
    parent: '系统设置',
  },
];
/**
 * 搜索页面和功能模块
 */
function searchPages(query: string) {
  const lowerQuery = query.toLowerCase();
  
  return ADMIN_PAGES.filter(page => {
    // 搜索标题
    if (page.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // 搜索关键词
    if (page.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    
    // 搜索描述
    if (page.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    return false;
  }).map(page => ({
    id: page.id,
    type: page.type,
    title: page.title,
    subtitle: page.description,
    parent: (page as any).parent,
    url: page.url,
  }));
}

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

    // 搜索页面和功能模块（优先显示）
    const pageResults = searchPages(query);

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
      // 页面和功能模块结果（优先显示）
      ...pageResults,
      
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
      counts: {
        pages: pageResults.length,
        products: products.length,
        orders: orders.length,
        users: users.length,
      },
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



