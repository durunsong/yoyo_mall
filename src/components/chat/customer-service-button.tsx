/**
 * 客服按钮组件(可选)
 * 用于手动触发 Tawk.to 客服窗口
 */

'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TawkToAPI } from './tawk-to-widget';

interface CustomerServiceButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function CustomerServiceButton({
  className,
  variant = 'default',
  size = 'default',
  showText = true,
}: CustomerServiceButtonProps) {
  const handleClick = () => {
    // 打开客服窗口
    TawkToAPI.maximize();
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      <MessageCircle className={showText ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />
      {showText && '联系客服'}
    </Button>
  );
}

