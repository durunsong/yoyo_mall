/**
 * 系统设置API
 * GET - 获取系统设置
 * PUT - 更新系统设置（支持部分更新）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';

/**
 * GET /api/admin/settings
 * 获取系统设置
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin();

    // 检查 Prisma 是否正确初始化
    if (!prisma || !prisma.systemSettings) {
      console.error('Prisma client not properly initialized or SystemSettings model not found');
      return NextResponse.json(
        {
          success: false,
          error: 'Database client not properly initialized. Please restart the server after running: npx prisma generate',
        },
        { status: 500 }
      );
    }

    // 获取系统设置，如果不存在则使用默认值
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'global' },
    });

    // 如果设置不存在，创建默认设置
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'global',
          siteName: 'YoYo Mall',
          siteDescription: '您的跨境电商平台',
          siteUrl: 'https://yoyomall.com',
          contactEmail: 'support@yoyomall.com',
          contactPhone: '+86 400-123-4567',
          defaultLanguage: 'zh-CN',
          defaultCurrency: 'CNY',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('获取系统设置失败:', error);
    
    const status = error.status || 500;
    const message = error.message || '获取系统设置失败';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}

/**
 * PUT /api/admin/settings
 * 更新系统设置（支持部分更新）
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin();

    const body = await request.json();

    // 验证必填字段（如果提供的话）
    if (body.siteName !== undefined && body.siteName.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: '网站名称不能为空',
        },
        { status: 400 }
      );
    }

    // 构建更新数据对象（只更新提供的字段）
    const updateData: any = {};
    
    // 网站基本信息
    if (body.siteName !== undefined) updateData.siteName = body.siteName;
    if (body.siteDescription !== undefined) updateData.siteDescription = body.siteDescription || null;
    if (body.siteUrl !== undefined) updateData.siteUrl = body.siteUrl || null;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail || null;
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone || null;
    if (body.defaultLanguage !== undefined) updateData.defaultLanguage = body.defaultLanguage;
    if (body.defaultCurrency !== undefined) updateData.defaultCurrency = body.defaultCurrency;
    
    // 支付设置
    if (body.stripeEnabled !== undefined) updateData.stripeEnabled = body.stripeEnabled;
    if (body.stripePublicKey !== undefined) updateData.stripePublicKey = body.stripePublicKey || null;
    if (body.stripeSecretKey !== undefined) updateData.stripeSecretKey = body.stripeSecretKey || null;
    if (body.alipayEnabled !== undefined) updateData.alipayEnabled = body.alipayEnabled;
    if (body.alipayAppId !== undefined) updateData.alipayAppId = body.alipayAppId || null;
    if (body.alipayPrivateKey !== undefined) updateData.alipayPrivateKey = body.alipayPrivateKey || null;
    if (body.wechatPayEnabled !== undefined) updateData.wechatPayEnabled = body.wechatPayEnabled;
    if (body.wechatPayMchId !== undefined) updateData.wechatPayMchId = body.wechatPayMchId || null;
    if (body.wechatPayApiKey !== undefined) updateData.wechatPayApiKey = body.wechatPayApiKey || null;
    
    // 邮件设置
    if (body.smtpHost !== undefined) updateData.smtpHost = body.smtpHost || null;
    if (body.smtpPort !== undefined) updateData.smtpPort = body.smtpPort ? parseInt(body.smtpPort) : null;
    if (body.smtpUser !== undefined) updateData.smtpUser = body.smtpUser || null;
    if (body.smtpPassword !== undefined) updateData.smtpPassword = body.smtpPassword || null;
    if (body.smtpSecure !== undefined) updateData.smtpSecure = body.smtpSecure;
    if (body.emailFrom !== undefined) updateData.emailFrom = body.emailFrom || null;
    if (body.emailFromName !== undefined) updateData.emailFromName = body.emailFromName || null;
    
    // 通知设置
    if (body.orderNotifications !== undefined) updateData.orderNotifications = body.orderNotifications;
    if (body.userNotifications !== undefined) updateData.userNotifications = body.userNotifications;
    if (body.inventoryAlerts !== undefined) updateData.inventoryAlerts = body.inventoryAlerts;
    if (body.emailNotifications !== undefined) updateData.emailNotifications = body.emailNotifications;
    if (body.smsNotifications !== undefined) updateData.smsNotifications = body.smsNotifications;

    // 更新或创建系统设置
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: updateData,
      create: {
        id: 'global',
        siteName: body.siteName || 'YoYo Mall',
        siteDescription: body.siteDescription || null,
        siteUrl: body.siteUrl || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        defaultLanguage: body.defaultLanguage || 'zh-CN',
        defaultCurrency: body.defaultCurrency || 'CNY',
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      data: settings,
      message: '系统设置已保存',
    });
  } catch (error: any) {
    console.error('保存系统设置失败:', error);
    
    const status = error.status || 500;
    const message = error.message || '保存系统设置失败';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}

