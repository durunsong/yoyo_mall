/**
 * 统一的国际化管理Hook
 * 简化版本，专为shadcn/ui设计
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// 类型定义
export type Locale = 'zh-CN' | 'en-US';

export interface Language {
  code: Locale;
  name: string;
  flag: string;
}

// 语言配置
export const LANGUAGES: Language[] = [
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
];

// 翻译缓存
const translationsCache: Record<string, Record<string, any>> = {};

// 全局语言状态管理
class I18nManager {
  private static instance: I18nManager;
  private listeners: Set<(locale: Locale) => void> = new Set();
  private currentLocale: Locale = 'zh-CN';

  private constructor() {
    this.initializeLocale();
  }

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  private initializeLocale() {
    if (typeof window !== 'undefined') {
      try {
        const savedLocale = localStorage.getItem('locale') as Locale;
        if (savedLocale && LANGUAGES.some(lang => lang.code === savedLocale)) {
          this.currentLocale = savedLocale;
        }
      } catch (error) {
        console.warn('Failed to read locale from localStorage:', error);
      }
    }
  }

  getCurrentLocale(): Locale {
    return this.currentLocale;
  }

  changeLocale(newLocale: Locale): void {
    if (newLocale === this.currentLocale) return;

    this.currentLocale = newLocale;

    // 更新localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('locale', newLocale);
        
        // 发送自定义事件（保持向后兼容）
        window.dispatchEvent(new CustomEvent('localeChange', { detail: newLocale }));
      } catch (error) {
        console.warn('Failed to save locale to localStorage:', error);
      }
    }

    // 通知所有监听器
    this.listeners.forEach(listener => listener(newLocale));
    
    console.log('Language changed to:', newLocale);
  }

  subscribe(listener: (locale: Locale) => void): () => void {
    this.listeners.add(listener);
    
    // 立即调用一次，确保组件获得初始状态
    listener(this.currentLocale);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 加载翻译文件
  async loadTranslations(locale: Locale, namespace: string): Promise<Record<string, any>> {
    const cacheKey = `${locale}-${namespace}`;
    
    if (translationsCache[cacheKey]) {
      return translationsCache[cacheKey];
    }

    try {
      const response = await fetch(`/locales/${locale}/${namespace}.json`);
      if (response.ok) {
        const data = await response.json();
        translationsCache[cacheKey] = data;
        return data;
      } else {
        console.warn(`Failed to load translations for ${locale}/${namespace}`);
        return {};
      }
    } catch (error) {
      console.error(`Error loading translations for ${locale}/${namespace}:`, error);
      return {};
    }
  }
}

// 解析嵌套键（如 "features.title" → translations.features.title）
function getNestedTranslation(source: Record<string, any>, keyPath: string): unknown {
  if (!source) return undefined;
  if (!keyPath || typeof keyPath !== 'string') return undefined;
  // 仅当key包含点号时走嵌套解析，否则直接返回
  if (keyPath.indexOf('.') === -1) {
    return source[keyPath];
  }
  const segments = keyPath.split('.');
  let current: any = source;
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

// Hook: 基础语言管理
export function useI18n() {
  const [locale, setLocale] = useState<Locale>(() => 
    I18nManager.getInstance().getCurrentLocale(),
  );

  useEffect(() => {
    const manager = I18nManager.getInstance();
    const unsubscribe = manager.subscribe(setLocale);
    return unsubscribe;
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    I18nManager.getInstance().changeLocale(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    const currentIndex = LANGUAGES.findIndex(lang => lang.code === locale);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    changeLocale(LANGUAGES[nextIndex].code);
  }, [locale, changeLocale]);

  const language = LANGUAGES.find(lang => lang.code === locale) || LANGUAGES[0];

  return {
    locale,
    language,
    changeLocale,
    toggleLocale,
    languages: LANGUAGES,
  };
}

// Hook: 翻译文本
export function useTranslations(namespace: string = 'common') {
  const { locale } = useI18n();
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadTranslations = async () => {
      setLoading(true);
      try {
        const data = await I18nManager.getInstance().loadTranslations(locale, namespace);
        if (!isCancelled) {
          setTranslations(data);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      isCancelled = true;
    };
  }, [locale, namespace]);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const resolved = getNestedTranslation(translations, key);
    // 若未命中，则回退为key
    if (resolved === undefined || resolved === null) return key;
    // 若为对象（非字符串），避免将对象渲染到视图，回退为key
    if (typeof resolved !== 'string' && typeof resolved !== 'number') return key;

    let translation = String(resolved);
    // 处理参数替换
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, 'g'),
          String(value),
        );
      });
    }
    return translation;
  }, [translations]);

  return {
    t,
    loading,
    locale,
  };
}

// Hook: 静态翻译（用于无需动态加载的场景）
export function useStaticTranslations(namespace: string = 'common') {
  const { locale } = useI18n();
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    
    const loadStaticTranslations = async () => {
      try {
        const data = await I18nManager.getInstance().loadTranslations(locale, namespace);
        if (!isCancelled) {
          setTranslations(data);
          setLoading(false);
        }
      } catch (error) {
        console.error(`Error loading static translations for ${locale}/${namespace}:`, error);
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadStaticTranslations();
    
    return () => {
      isCancelled = true;
    };
  }, [locale, namespace]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (loading) return key;
    const resolved = getNestedTranslation(translations, key);
    if (resolved === undefined || resolved === null) return key;
    if (typeof resolved !== 'string' && typeof resolved !== 'number') return key;

    let translation = String(resolved);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, 'g'),
          String(value),
        );
      });
    }
    return translation;
  }, [translations, loading]);

  return { t, locale };
}
