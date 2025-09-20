/**
 * 商品卡片组件 - shadcn/ui版本
 * 展示商品信息的卡片
 */

'use client';

import Link from 'next/link';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    rating?: number;
    reviews?: number;
    inStock?: boolean;
    featured?: boolean;
  };
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export default function ProductCard({ 
  product, 
  onAddToCart,
  className = '' 
}: ProductCardProps) {
  const {
    id,
    name,
    price,
    originalPrice,
    image,
    rating = 0,
    reviews = 0,
    inStock = true,
    featured = false
  } = product;

  return (
    <Card className={`group transition-shadow hover:shadow-lg ${className}`}>
      <CardContent className="p-0">
        {/* 商品图片 */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-300">
                <span className="text-xs text-gray-500">商品图片</span>
              </div>
            </div>
          )}
          
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="font-medium text-white">暂时缺货</span>
            </div>
          )}
          
          {featured && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              精选
            </Badge>
          )}
          
          {originalPrice && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              特价
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-white/80 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* 商品信息 */}
        <div className="p-4">
          <Link href={`/products/${id}`}>
            <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900 hover:text-blue-600">
              {name}
            </h3>
          </Link>

          {/* 评分 */}
          {rating > 0 && (
            <div className="mb-2 flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'fill-current text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 text-sm text-gray-600">
                {rating} ({reviews})
              </span>
            </div>
          )}

          {/* 价格 */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-blue-600">
                ¥{price}
              </span>
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ¥{originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <Button 
            className="w-full" 
            disabled={!inStock}
            onClick={() => onAddToCart?.(id)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {inStock ? '加入购物车' : '暂时缺货'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}