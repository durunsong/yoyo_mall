/**
 * 商品卡片组件
 * 用于在列表中展示商品信息
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Button, Tag, Rate, Badge, Spin, Typography } from 'antd';
import { 
  ShoppingCartOutlined, 
  HeartOutlined, 
  EyeOutlined,
  FireOutlined 
} from '@ant-design/icons';
import { useCartApi, useIsInCart } from '@/hooks/use-cart-api';
import type { Product } from '@/hooks/use-products';

const { Text, Title } = Typography;
const { Meta } = Card;

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showQuickView?: boolean;
  className?: string;
}

export default function ProductCard({ 
  product, 
  showAddToCart = true,
  showQuickView = true,
  className = '' 
}: ProductCardProps) {
  const { addToCart } = useCartApi();
  const isInCart = useIsInCart(product.id);
  const [addingToCart, setAddingToCart] = useState(false);

  // 处理添加到购物车
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAddingToCart(true);
    await addToCart(product.id, 1);
    setAddingToCart(false);
  };

  // 计算折扣百分比
  const discountPercentage = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
    }).format(price);
  };

  // 库存状态
  const getStockStatus = () => {
    if (!product.inStock) return { status: 'error', text: '缺货' };
    if (product.isLowStock) return { status: 'warning', text: '库存紧张' };
    return { status: 'success', text: '有货' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className={`group relative ${className}`}>
      <Card
        hoverable
        className="h-full transition-all duration-300 group-hover:shadow-lg"
        cover={
          <div className="relative aspect-square overflow-hidden">
            <Link href={`/products/${product.slug}`}>
              <Image
                src={product.images[0]?.url || '/placeholder-product.jpg'}
                alt={product.images[0]?.alt || product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </Link>
            
            {/* 折扣标签 */}
            {discountPercentage > 0 && (
              <Badge.Ribbon 
                text={`-${discountPercentage}%`} 
                color="red"
                className="absolute top-0 right-0"
              />
            )}

            {/* 热销标签 */}
            {product.reviewCount > 10 && product.averageRating > 4 && (
              <Tag 
                icon={<FireOutlined />} 
                color="volcano"
                className="absolute top-2 left-2"
              >
                热销
              </Tag>
            )}

            {/* 库存状态标签 */}
            <Tag 
              color={stockStatus.status}
              className="absolute bottom-2 left-2"
            >
              {stockStatus.text}
            </Tag>

            {/* 悬停操作按钮 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                {showQuickView && (
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<EyeOutlined />}
                    size="large"
                    className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                  />
                )}
                <Button 
                  shape="circle" 
                  icon={<HeartOutlined />}
                  size="large"
                  className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                />
              </div>
            </div>
          </div>
        }
        actions={showAddToCart ? [
          <Button
            key="add-to-cart"
            type={isInCart ? "default" : "primary"}
            icon={addingToCart ? <Spin size="small" /> : <ShoppingCartOutlined />}
            loading={addingToCart}
            disabled={!product.inStock || addingToCart}
            onClick={handleAddToCart}
            className="w-full"
          >
            {isInCart ? '已在购物车' : addingToCart ? '添加中...' : '加入购物车'}
          </Button>
        ] : undefined}
      >
        <div className="space-y-2">
          {/* 品牌 */}
          {product.brand && (
            <Text type="secondary" className="text-xs">
              {product.brand.name}
            </Text>
          )}

          {/* 商品名称 */}
          <Link href={`/products/${product.slug}`}>
            <Title 
              level={5} 
              className="!mb-1 line-clamp-2 hover:text-blue-600 transition-colors"
            >
              {product.name}
            </Title>
          </Link>

          {/* 简短描述 */}
          {product.shortDesc && (
            <Text 
              type="secondary" 
              className="text-sm line-clamp-2"
            >
              {product.shortDesc}
            </Text>
          )}

          {/* 评分和评论数 */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <Rate 
                disabled 
                defaultValue={product.averageRating} 
                allowHalf 
                className="text-sm"
              />
              <Text type="secondary" className="text-xs">
                ({product.reviewCount})
              </Text>
            </div>
          )}

          {/* 价格 */}
          <div className="flex items-center gap-2">
            <Text className="text-lg font-bold text-red-500">
              {formatPrice(product.price)}
            </Text>
            {product.comparePrice && product.comparePrice > product.price && (
              <Text delete type="secondary" className="text-sm">
                {formatPrice(product.comparePrice)}
              </Text>
            )}
          </div>

          {/* 标签 */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} size="small" className="text-xs">
                  {tag}
                </Tag>
              ))}
              {product.tags.length > 3 && (
                <Text type="secondary" className="text-xs">
                  +{product.tags.length - 3}
                </Text>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
