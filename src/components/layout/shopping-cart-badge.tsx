/**
 * 购物车徽章组件 - shadcn/ui版本
 * 显示购物车商品数量
 */

'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShoppingCartBadgeProps {
  count?: number;
  onClick?: () => void;
}

export default function ShoppingCartBadge({ 
  count = 0, 
  onClick 
}: ShoppingCartBadgeProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative"
      onClick={onClick}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-4 min-w-4 justify-center p-0 text-xs"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
}