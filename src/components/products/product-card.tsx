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
import { useStaticTranslations } from '@/hooks/use-i18n';

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
  onAddToCart?: (product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  }) => void;
  onAddToWishlist?: (productId: string) => void;
  className?: string;
}

export default function ProductCard({ 
  product, 
  onAddToCart,
  onAddToWishlist,
  className = '', 
}: ProductCardProps) {
  const { t } = useStaticTranslations('common');
  const {
    id,
    name,
    price,
    originalPrice,
    image,
    rating = 0,
    reviews = 0,
    inStock = true,
    featured = false,
  } = product;

  // 处理收藏
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止Link导航
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(id);
    }
  };

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
              <span className="font-medium text-white">{t('outOfStock')}</span>
            </div>
          )}
          
          {featured && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              {t('featured')}
            </Badge>
          )}
          
          {originalPrice && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              {t('specialOffer')}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-white/80 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
            onClick={handleWishlist}
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
            onClick={() => onAddToCart?.({ id, name, price, image })}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {inStock ? t('addToCart') : t('outOfStock')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}