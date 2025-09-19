/**
 * 客户端翻译Hook
 * 为客户端组件提供简单的翻译功能
 */

'use client';

import { useState, useEffect } from 'react';

type Translations = Record<string, any>;
type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

const translationsCache: Record<string, Translations> = {};

export function useTranslations(namespace: string = 'common') {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  // 加载翻译文件
  const loadTranslations = async (currentLocale: Locale, ns: string) => {
    const cacheKey = `${currentLocale}-${ns}`;
    
    if (translationsCache[cacheKey]) {
      setTranslations(translationsCache[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/locales/${currentLocale}/${ns}.json`);
      if (response.ok) {
        const data = await response.json();
        translationsCache[cacheKey] = data;
        setTranslations(data);
      } else {
        console.warn(`Failed to load translations for ${currentLocale}/${ns}`);
        setTranslations({});
      }
    } catch (error) {
      console.error(`Error loading translations for ${currentLocale}/${ns}:`, error);
      setTranslations({});
    } finally {
      setLoading(false);
    }
  };

  // 监听语言变化
  useEffect(() => {
    // 初始化语言
    const savedLocale = (localStorage.getItem('locale') as Locale) || 'zh-CN';
    setLocale(savedLocale);

    // 监听语言变化事件
    const handleLocaleChange = (event: CustomEvent) => {
      const newLocale = event.detail as Locale;
      setLocale(newLocale);
    };

    window.addEventListener('localeChange', handleLocaleChange as EventListener);

    return () => {
      window.removeEventListener('localeChange', handleLocaleChange as EventListener);
    };
  }, []);

  // 加载翻译文件
  useEffect(() => {
    loadTranslations(locale, namespace);
  }, [locale, namespace]);

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key;

    // 处理参数替换
    if (params && typeof translation === 'string') {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, 'g'),
          String(value)
        );
      });
    }

    return translation;
  };

  return {
    t,
    locale,
    loading,
    changeLocale: (newLocale: Locale) => {
      localStorage.setItem('locale', newLocale);
      setLocale(newLocale);
      window.dispatchEvent(new CustomEvent('localeChange', { detail: newLocale }));
    }
  };
}

// 静态翻译数据作为备用
const staticTranslations: Record<Locale, Record<string, any>> = {
  'zh-CN': {
    common: {
      home: '首页',
      products: '商品',
      categories: '分类',
      brands: '品牌',
      deals: '优惠',
      cart: '购物车',
      login: '登录',
      register: '注册',
      logout: '退出',
      search: '搜索',
      searchPlaceholder: '搜索商品...',
      menu: '菜单',
      welcome: '欢迎',
      loading: '加载中...',
    },
    navigation: {
      home: '首页',
      shop: '商店',
      about: '关于我们',
      contact: '联系我们',
      profile: '个人中心',
    }
  },
  'en-US': {
    common: {
      home: 'Home',
      products: 'Products',
      categories: 'Categories',
      brands: 'Brands',
      deals: 'Deals',
      cart: 'Cart',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      search: 'Search',
      searchPlaceholder: 'Search products...',
      menu: 'Menu',
      welcome: 'Welcome',
      loading: 'Loading...',
    },
    navigation: {
      home: 'Home',
      shop: 'Shop',
      about: 'About Us',
      contact: 'Contact Us',
      profile: 'Profile',
    }
  },
  'ja-JP': {
    common: {
      home: 'ホーム',
      products: '商品',
      categories: 'カテゴリー',
      brands: 'ブランド',
      deals: 'セール',
      cart: 'カート',
      login: 'ログイン',
      register: '登録',
      logout: 'ログアウト',
      search: '検索',
      searchPlaceholder: '商品を検索...',
      menu: 'メニュー',
      welcome: 'ようこそ',
      loading: '読み込み中...',
    },
    navigation: {
      home: 'ホーム',
      shop: 'ショップ',
      about: '会社概要',
      contact: 'お問い合わせ',
      profile: 'プロフィール',
    }
  },
  'ko-KR': {
    common: {
      home: '홈',
      products: '상품',
      categories: '카테고리',
      brands: '브랜드',
      deals: '특가',
      cart: '장바구니',
      login: '로그인',
      register: '회원가입',
      logout: '로그아웃',
      search: '검색',
      searchPlaceholder: '상품 검색...',
      menu: '메뉴',
      welcome: '환영합니다',
      loading: '로딩 중...',
    },
    navigation: {
      home: '홈',
      shop: '쇼핑',
      about: '회사소개',
      contact: '문의하기',
      profile: '프로필',
    }
  }
};

// 备用翻译函数
export function useStaticTranslations(namespace: string = 'common') {
  const [locale, setLocale] = useState<Locale>('zh-CN');

  useEffect(() => {
    const savedLocale = (localStorage.getItem('locale') as Locale) || 'zh-CN';
    setLocale(savedLocale);

    const handleLocaleChange = (event: CustomEvent) => {
      setLocale(event.detail as Locale);
    };

    window.addEventListener('localeChange', handleLocaleChange as EventListener);
    return () => window.removeEventListener('localeChange', handleLocaleChange as EventListener);
  }, []);

  const t = (key: string): string => {
    return staticTranslations[locale]?.[namespace]?.[key] || key;
  };

  return { t, locale };
}
