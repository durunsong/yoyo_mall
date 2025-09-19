/**
 * 性能数据收集API端点
 * 接收并处理Web Vitals性能指标
 */

import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

// 存储性能数据的简单内存缓存（生产环境应使用数据库）
const performanceData: PerformanceMetric[] = [];
const MAX_CACHE_SIZE = 1000;

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetric = await request.json();

    // 验证数据格式
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // 添加用户代理和IP信息
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    const enrichedMetric = {
      ...metric,
      userAgent,
      ip: ip.toString(),
      receivedAt: new Date().toISOString(),
    };

    // 存储到缓存中
    performanceData.push(enrichedMetric);

    // 保持缓存大小限制
    if (performanceData.length > MAX_CACHE_SIZE) {
      performanceData.splice(0, performanceData.length - MAX_CACHE_SIZE);
    }

    // 在开发环境下记录日志
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance metric received:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
      });
    }

    // 检查是否需要告警
    if (metric.rating === 'poor') {
      console.warn(`⚠️ Poor performance detected: ${metric.name} = ${metric.value} on ${metric.url}`);
      
      // 这里可以集成告警服务，如发送邮件、Slack通知等
      // await sendPerformanceAlert(metric);
    }

    // 生产环境下可以将数据发送到分析服务
    if (process.env.NODE_ENV === 'production') {
      // 示例：发送到Google Analytics
      // await sendToGoogleAnalytics(metric);
      
      // 示例：发送到自定义分析服务
      // await sendToAnalyticsService(metric);
      
      // 示例：存储到数据库
      // await saveToDatabase(metric);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

// 获取性能统计数据的端点
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric');
    const since = url.searchParams.get('since');

    let filteredData = [...performanceData];

    // 按指标类型过滤
    if (metric) {
      filteredData = filteredData.filter(d => d.name === metric);
    }

    // 按时间过滤
    if (since) {
      const sinceTimestamp = parseInt(since);
      filteredData = filteredData.filter(d => d.timestamp >= sinceTimestamp);
    }

    // 计算统计信息
    const stats = {
      total: filteredData.length,
      metrics: {} as Record<string, {
        count: number;
        average: number;
        median: number;
        p95: number;
        good: number;
        needsImprovement: number;
        poor: number;
      }>,
    };

    // 按指标名称分组计算统计
    const metricGroups = filteredData.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = [];
      }
      acc[item.name].push(item);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    Object.entries(metricGroups).forEach(([name, items]) => {
      const values = items.map(item => item.value).sort((a, b) => a - b);
      const ratings = items.map(item => item.rating);

      stats.metrics[name] = {
        count: items.length,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: values[Math.floor(values.length / 2)],
        p95: values[Math.floor(values.length * 0.95)],
        good: ratings.filter(r => r === 'good').length,
        needsImprovement: ratings.filter(r => r === 'needs-improvement').length,
        poor: ratings.filter(r => r === 'poor').length,
      };
    });

    return NextResponse.json({
      success: true,
      data: stats,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error retrieving performance stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stats' },
      { status: 500 }
    );
  }
}

// 辅助函数：发送到Google Analytics（示例）
async function sendToGoogleAnalytics(metric: PerformanceMetric) {
  if (!process.env.GA_MEASUREMENT_ID) return;

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: metric.id,
          events: [{
            name: 'web_vitals',
            params: {
              metric_name: metric.name,
              metric_value: metric.value,
              metric_rating: metric.rating,
              page_location: metric.url,
            },
          }],
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to send to Google Analytics:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending to Google Analytics:', error);
  }
}

// 辅助函数：发送性能告警（示例）
async function sendPerformanceAlert(metric: PerformanceMetric) {
  // 实现告警逻辑，如发送邮件、Slack消息等
  console.log(`🚨 Performance Alert: ${metric.name} is performing poorly (${metric.value}) on ${metric.url}`);
}
