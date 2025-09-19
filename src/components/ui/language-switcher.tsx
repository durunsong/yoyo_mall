/**
 * 语言切换器组件
 * 使用next-i18next进行多语言切换
 */

'use client';

import React from 'react';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const { Option } = Select;

// 语言选项
const languages = [
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
];

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const router = useRouter();
  const { i18n } = useTranslation();

  const handleLanguageChange = (locale: string) => {
    // 使用push方法切换语言，但保持在同一个页面
    router.push(router.asPath, router.asPath, { locale });
  };

  const currentLanguage = languages.find(lang => lang.code === router.locale) || languages[0];

  return (
    <Select
      value={router.locale}
      onChange={handleLanguageChange}
      className={className}
      style={{ width: 120 }}
      suffixIcon={<GlobalOutlined />}
      popupMatchSelectWidth={false}
    >
      {languages.map((lang) => (
        <Option key={lang.code} value={lang.code}>
          <span className="flex items-center gap-2">
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </span>
        </Option>
      ))}
    </Select>
  );
}