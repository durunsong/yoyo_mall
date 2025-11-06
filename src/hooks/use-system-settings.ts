/**
 * 全局系统设置Hook
 * 用于在前台页面获取系统设置（如货币符号等）
 */

'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import {
  ProductDetailConfig,
  defaultProductDetailConfig,
  normalizeProductDetailConfig,
} from '@/lib/config/product-detail';

interface SystemSettings {
  siteName: string;
  siteDescription: string | null;
  siteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  defaultLanguage: string;
  defaultCurrency: string;
  stripeEnabled: boolean;
  alipayEnabled: boolean;
  wechatPayEnabled: boolean;
  productDetailConfig: ProductDetailConfig;
}

interface SettingsStore {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
}

// 默认设置
const defaultSettings: SystemSettings = {
  siteName: 'YoYo Mall',
  siteDescription: '您的跨境电商平台',
  siteUrl: 'https://yoyomall.com',
  contactEmail: 'support@yoyomall.com',
  contactPhone: '+86 400-123-4567',
  defaultLanguage: 'zh-CN',
  defaultCurrency: 'CNY',
  stripeEnabled: false,
  alipayEnabled: false,
  wechatPayEnabled: false,
  productDetailConfig: normalizeProductDetailConfig(defaultProductDetailConfig),
};

// Zustand store
const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,
  error: null,
  
  fetchSettings: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        const normalizedSettings: SystemSettings = {
          ...defaultSettings,
          ...data.data,
          productDetailConfig: normalizeProductDetailConfig(
            data.data.productDetailConfig,
          ),
        };

        set({ settings: normalizedSettings, loading: false });
      } else {
        set({ settings: defaultSettings, loading: false });
      }
    } catch (error) {
      console.error('获取系统设置失败:', error);
      set({ 
        settings: defaultSettings, 
        loading: false, 
        error: '获取系统设置失败', 
      });
    }
  },
}));

/**
 * 使用系统设置Hook
 */
export function useSystemSettings() {
  const { settings, loading, error, fetchSettings } = useSettingsStore();
  
  // 组件挂载时加载设置
  useEffect(() => {
    if (!settings && !loading) {
      fetchSettings();
    }
  }, [settings, loading, fetchSettings]);
  
  return {
    settings: settings || defaultSettings,
    loading,
    error,
    refresh: fetchSettings,
  };
}

/**
 * 获取货币符号
 */
export function getCurrencySymbol(currency: string): string {
  const currencyMap: Record<string, string> = {
    'CNY': '¥',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'KRW': '₩',
    'HKD': 'HK$',
    'TWD': 'NT$',
  };
  
  return currencyMap[currency] || currency;
}

/**
 * 格式化价格
 */
export function formatPrice(price: number, currency?: string): string {
  const { settings } = useSettingsStore.getState();
  const curr = currency || settings?.defaultCurrency || 'CNY';
  const symbol = getCurrencySymbol(curr);
  
  return `${symbol}${price.toFixed(2)}`;
}

