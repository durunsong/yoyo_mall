/**
 * 根提供者组件
 * 包装 Ant Design 的全局配置和主题
 */

'use client';

// React 19 兼容性补丁
import '@ant-design/v5-patch-for-react-19';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { antdTheme } from '@/lib/antd-theme';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './auth-provider';
import PerformanceMonitor from '@/components/performance/performance-monitor';

interface RootProvidersProps {
  children: React.ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <AuthProvider>
      <AntdRegistry>
        <ConfigProvider theme={antdTheme} locale={zhCN}>
          <PerformanceMonitor />
          {children}
        </ConfigProvider>
      </AntdRegistry>
    </AuthProvider>
  );
}
