/**
 * 语言切换器组件
 * 客户端语言切换，不依赖next-i18next
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Select, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

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
  mode?: 'select' | 'button';
}

export default function LanguageSwitcher({ 
  className = '', 
  mode = 'select' 
}: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState('zh-CN');

  // 从localStorage获取当前语言
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'zh-CN';
    setCurrentLocale(savedLocale);
  }, []);

  const handleLanguageChange = (locale: string) => {
    // 保存到localStorage
    localStorage.setItem('locale', locale);
    setCurrentLocale(locale);

    // 发送自定义事件通知其他组件
    window.dispatchEvent(new CustomEvent('localeChange', { detail: locale }));
    
    console.log('Language changed to:', locale);
  };

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  if (mode === 'button') {
    return (
      <Button 
        type="text" 
        icon={<GlobalOutlined />}
        className={className}
        onClick={() => {
          // 简单切换到下一个语言
          const currentIndex = languages.findIndex(lang => lang.code === currentLocale);
          const nextIndex = (currentIndex + 1) % languages.length;
          handleLanguageChange(languages[nextIndex].code);
        }}
      >
        {currentLanguage.flag}
      </Button>
    );
  }

  return (
    <Select
      value={currentLocale}
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