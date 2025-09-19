/**
 * 性能监控组件
 * 监控Web Vitals和页面性能指标
 */

'use client';

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB, type Metric } from 'web-vitals';

// 性能数据上报接口
interface PerformanceData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

// 发送性能数据到分析服务
const sendToAnalytics = (metric: Metric) => {
  const data: PerformanceData = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now(),
  };

  // 开发环境下打印性能数据
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Performance Metric:', data);
  }

  // 生产环境下发送到分析服务
  if (process.env.NODE_ENV === 'production') {
    // 使用 Navigator.sendBeacon 确保数据在页面卸载时也能发送
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics/performance', JSON.stringify(data));
    } else {
      // 降级到 fetch
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(error => {
        console.warn('Failed to send performance data:', error);
      });
    }
  }
};

// 性能阈值配置
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  
  // Other metrics
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// 获取性能评级
const getPerformanceRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// 显示性能提示
const showPerformanceToast = (metric: Metric) => {
  if (metric.rating === 'poor' && process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Poor ${metric.name} performance: ${metric.value.toFixed(2)}ms`);
    
    // 提供改进建议
    const suggestions = {
      LCP: '考虑优化图片、减少服务器响应时间、预加载关键资源',
      FID: '减少JavaScript阻塞时间、使用Web Workers、延迟加载非关键资源',
      CLS: '为图片和视频设置尺寸、避免在现有内容上方插入内容',
      FCP: '优化字体加载、减少阻塞渲染的资源',
      TTFB: '优化服务器配置、使用CDN、减少数据库查询时间',
    };
    
    const suggestion = suggestions[metric.name as keyof typeof suggestions];
    if (suggestion) {
      console.info(`💡 改进建议: ${suggestion}`);
    }
  }
};

// Resource Timing监控
const monitorResourceTiming = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 监控长时间加载的资源
        if (entry.duration > 2000) {
          console.warn(`🐌 Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
        
        // 监控大尺寸的资源
        if ('transferSize' in entry && entry.transferSize > 1024 * 1024) { // 1MB
          console.warn(`📦 Large resource: ${entry.name} is ${(entry.transferSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    return () => observer.disconnect();
  }
};

// Memory监控
const monitorMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory;
    
    setInterval(() => {
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      
      // 内存使用超过80%时警告
      if (usedMB / limitMB > 0.8) {
        console.warn(`🧠 High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
      }
      
      // 在开发环境下定期输出内存使用情况
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Memory: ${usedMB.toFixed(2)}MB used, ${totalMB.toFixed(2)}MB total, ${limitMB.toFixed(2)}MB limit`);
      }
    }, 30000); // 每30秒检查一次
  }
};

export default function PerformanceMonitor() {
  useEffect(() => {
    // 监控 Core Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);

    // 监控资源加载
    const cleanup = monitorResourceTiming();
    
    // 监控内存使用
    monitorMemoryUsage();
    
    // 监控长任务
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`⏱️ Long task detected: ${entry.duration.toFixed(2)}ms`);
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // Long task API may not be supported
      }
      
      return () => {
        longTaskObserver.disconnect();
        cleanup?.();
      };
    }
    
    return cleanup;
  }, []);

  // 组件不渲染任何UI
  return null;
}

// 性能数据类型导出
export type { PerformanceData, Metric };

// 手动发送自定义性能指标
export const trackCustomMetric = (name: string, value: number, additionalData?: Record<string, any>) => {
  const metric: Metric = {
    name,
    value,
    rating: getPerformanceRating(name, value),
    delta: value,
    id: `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    navigationType: 'reload',
  };
  
  sendToAnalytics(metric);
  
  // 发送额外数据
  if (additionalData && process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: name,
        value,
        ...additionalData,
        timestamp: Date.now(),
      }),
    }).catch(error => {
      console.warn('Failed to send custom metric:', error);
    });
  }
};
