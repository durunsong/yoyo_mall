/**
 * 语言切换组件
 * 允许用户在不同语言之间切换
 */

'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useLocaleStorage } from '@/hooks/use-locale-storage';

// 语言配置
const languages = [
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'default', 
  className 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { currentLocale, setLocale } = useLocaleStorage();

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    // 使用hook保存语言偏好
    setLocale(newLocale);
    
    // 构建新的URL
    const currentPathname = pathname;
    let newPath: string;
    
    // 获取当前路径中的语言部分
    const pathSegments = currentPathname.split('/').filter(Boolean);
    const currentLocaleFromPath = pathSegments[0];
    
    // 检查第一个段是否是语言代码
    const isCurrentPathHasLocale = languages.some(lang => lang.code === currentLocaleFromPath);
    
    if (newLocale === 'zh-CN') {
      // 切换到默认语言，移除语言前缀
      if (isCurrentPathHasLocale) {
        // 移除语言前缀
        newPath = '/' + pathSegments.slice(1).join('/');
      } else {
        // 当前就是默认语言
        newPath = currentPathname;
      }
    } else {
      // 切换到非默认语言
      if (isCurrentPathHasLocale) {
        // 替换现有语言前缀
        pathSegments[0] = newLocale;
        newPath = '/' + pathSegments.join('/');
      } else {
        // 添加语言前缀
        newPath = `/${newLocale}${currentPathname === '/' ? '' : currentPathname}`;
      }
    }
    
    // 清理路径
    newPath = newPath.replace(/\/+/g, '/');
    if (newPath === '') newPath = '/';
    
    console.log(`语言切换: ${currentLocale} → ${newLocale}`);
    console.log(`路径切换: ${currentPathname} → ${newPath}`);
    
    // 使用window.location.href进行完整的页面重新加载
    window.location.href = newPath;
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage.name}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
        
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border rounded-md shadow-lg min-w-[120px]">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={cn(
                    'flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                    currentLocale === language.code && 'bg-blue-50 text-blue-600'
                  )}
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border rounded-md shadow-lg min-w-[160px]">
            <div className="p-2 border-b">
              <p className="text-xs text-gray-500 font-medium">选择语言</p>
            </div>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  'flex items-center space-x-3 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                  currentLocale === language.code && 'bg-blue-50 text-blue-600'
                )}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {currentLocale === language.code && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
