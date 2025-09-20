/**
 * 语言切换器组件 - shadcn/ui版本
 * 客户端语言切换，使用统一的i18n系统
 */

'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/use-i18n';

interface LanguageSwitcherProps {
  className?: string;
  mode?: 'select' | 'button';
}

export default function LanguageSwitcher({ 
  className = '', 
  mode = 'select' 
}: LanguageSwitcherProps) {
  const { locale, language, languages, changeLocale, toggleLocale } = useI18n();

  if (mode === 'button') {
    return (
      <Button 
        variant="ghost" 
        size="icon"
        className={className}
        onClick={toggleLocale}
        suppressHydrationWarning
      >
        <Globe className="h-4 w-4" />
        <span className="ml-1" suppressHydrationWarning>{language.flag}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} suppressHydrationWarning>
          <Globe className="h-4 w-4" />
          <span className="ml-2" suppressHydrationWarning>{language.flag}</span>
          <span className="ml-1" suppressHydrationWarning>{language.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLocale(lang.code)}
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}