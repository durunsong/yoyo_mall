/**
 * 公共系统设置API（无需登录）
 * GET - 获取公开的系统设置（用于前台显示）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  defaultProductDetailConfig,
  normalizeProductDetailConfig,
} from '@/lib/config/product-detail';

/**
 * GET /api/settings
 * 获取公开的系统设置（不包含敏感信息）
 */
export async function GET(request: NextRequest) {
  try {
    // 获取系统设置
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'global' },
      select: {
        // 只返回公开字段
        siteName: true,
        siteDescription: true,
        siteUrl: true,
        contactEmail: true,
        contactPhone: true,
        defaultLanguage: true,
        defaultCurrency: true,
        // 支付方式启用状态（不包含密钥）
        stripeEnabled: true,
        alipayEnabled: true,
        wechatPayEnabled: true,
        productDetailConfig: true,
      },
    });

    // 如果设置不存在，返回默认值
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          siteName: 'Yobuy',
          siteDescription: '您的跨境电商平台',
          siteUrl: 'https://yoyomall.com',
          contactEmail: 'support@yoyomall.com',
          contactPhone: '+86 400-123-4567',
          defaultLanguage: 'en-US',
          defaultCurrency: 'CNY',
          stripeEnabled: false,
          alipayEnabled: false,
          wechatPayEnabled: false,
          productDetailConfig: defaultProductDetailConfig,
        },
      });
    }

    const normalizedConfig = normalizeProductDetailConfig(settings.productDetailConfig);

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        productDetailConfig: normalizedConfig,
      },
    });
  } catch (error: any) {
    console.error('获取系统设置失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取系统设置失败',
      },
      { status: 500 },
    );
  }
}

