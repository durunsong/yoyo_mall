/**
 * 语言存储 Hook
 * 统一管理语言偏好的存储和读取
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';

export function useLocaleStorage() {
  // const params = useParams(); // 暂时未使用
  const pathname = usePathname();

  // 从路由中检测当前语言
  const getLocaleFromPath = () => {
    const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    if (locales.includes(firstSegment)) {
      return firstSegment;
    }

    // 如果路径中没有语言前缀，说明是默认语言
    return 'zh-CN';
  };

  const currentLocale = getLocaleFromPath();
  const [storedLocale, setStoredLocale] = useState<string | null>(null);

  useEffect(() => {
    // 从localStorage读取语言偏好
    const stored = localStorage.getItem('preferred-locale');
    setStoredLocale(stored);

    // 如果当前语言与存储的语言不一致，更新存储
    if (stored !== currentLocale) {
      localStorage.setItem('preferred-locale', currentLocale);
      setStoredLocale(currentLocale);
    }
  }, [currentLocale]);

  const setLocale = (locale: string) => {
    // 同时设置cookie和localStorage
    document.cookie = `preferred-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('preferred-locale', locale);
    setStoredLocale(locale);

    // 更新localStorage中的i18n-storage
    const i18nStorage = {
      state: {
        locale: locale,
      },
      version: 0,
    };
    localStorage.setItem('i18n-storage', JSON.stringify(i18nStorage));
  };

  return {
    storedLocale,
    setLocale,
    currentLocale,
  };
}
