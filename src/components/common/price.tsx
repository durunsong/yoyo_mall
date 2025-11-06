/**
 * 价格显示组件
 * 自动根据系统设置显示正确的货币符号
 */

'use client';

import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';

interface PriceProps {
  amount: number;
  className?: string;
  showOriginal?: boolean;
  originalAmount?: number;
}

export function Price({ 
  amount, 
  className = '', 
  showOriginal = false,
  originalAmount, 
}: PriceProps) {
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  
  return (
    <div className={className}>
      {showOriginal && originalAmount && (
        <span className="mr-2 text-sm text-gray-500 line-through">
          {currencySymbol}{originalAmount.toFixed(2)}
        </span>
      )}
      <span className="font-bold text-blue-600">
        {currencySymbol}{amount.toFixed(2)}
      </span>
    </div>
  );
}

