/**
 * 简化的性能监控组件
 * 基础性能监控，无外部依赖
 */

'use client';

import { useEffect } from 'react';

// 简单的性能数据接口
interface SimplePerformanceData {
  name: string;
  value: number;
  url: string;
  timestamp: number;
}

// 发送性能数据到分析服务
const sendToAnalytics = (data: SimplePerformanceData) => {
  // 仅在开发环境下打印性能数据
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance:', data);
  }
};

// 基础页面加载监控
const monitorBasicPerformance = () => {
  if (typeof window === 'undefined') return;

  // 监控页面加载时间
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const navigationStart = typeof navigation.startTime === 'number' ? navigation.startTime : 0;
        const loadTime = navigation.loadEventEnd - navigationStart;
        
        sendToAnalytics({
          name: 'pageLoad',
          value: loadTime,
          url: window.location.href,
          timestamp: Date.now(),
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ Page loaded in ${loadTime.toFixed(2)}ms`);
        }
      }
    }, 100);
  });
};

export default function PerformanceMonitor() {
  useEffect(() => {
    // 仅监控基础页面加载性能
    monitorBasicPerformance();
  }, []);

  // 组件不渲染任何UI
  return null;
}

// 简单的自定义指标追踪
export const trackSimpleMetric = (name: string, value: number) => {
  if (typeof window === 'undefined') return;
  
  sendToAnalytics({
    name,
    value,
    url: window.location.href,
    timestamp: Date.now(),
  });
};