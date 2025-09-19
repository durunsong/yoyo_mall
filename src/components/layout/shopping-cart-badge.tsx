/**
 * 购物车徽章组件
 * 显示购物车中的商品数量
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Badge, Button } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useCartCount } from '@/hooks/use-cart-api';

interface ShoppingCartBadgeProps {
  className?: string;
}

export default function ShoppingCartBadge({ className = '' }: ShoppingCartBadgeProps) {
  const { data: session } = useSession();
  const cartCount = useCartCount();

  return (
    <Link href="/cart">
      <Badge count={session ? cartCount : 0} showZero={false} size="small">
        <Button 
          type="text" 
          icon={<ShoppingCartOutlined />} 
          className={className}
          size="large"
        />
      </Badge>
    </Link>
  );
}
