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
    images?: Array<{ url: string }>;
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
    images,
    rating = 0,
    reviews = 0,
    inStock = true,
    featured = false,
  } = product;

  const primaryImage = image || images?.[0]?.url;

  // 处理收藏
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止Link导航
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(id);
    }
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
      <CardContent className="p-0">
        {/* 商品图片 */}
        <Link href={`/products/${id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-200">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={name}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse">
                <span className="text-xs text-gray-600 font-medium">商品图片</span>
              </div>
            </div>
          )}
          
          {/* 悬停遮罩层 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <span className="font-semibold text-white text-lg">{t('outOfStock')}</span>
            </div>
          )}
          
          {featured && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg animate-pulse-subtle">
              ⭐ {t('featured')}
            </Badge>
          )}
          
          {originalPrice && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg animate-bounce-subtle">
              🔥 {t('specialOffer')}
            </Badge>
          )}
          
          {/* 悬停时显示的按钮组 */}
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg font-semibold cursor-pointer transition-all hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onAddToCart) {
                    onAddToCart({ id, name, price, image: primaryImage });
                  }
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                加入购物车
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-sm opacity-0 shadow-lg transition-all duration-300 hover:bg-red-50 hover:scale-110 group-hover:opacity-100"
            onClick={handleWishlist}
          >
            <Heart className="h-4 w-4 transition-colors hover:fill-red-500 hover:text-red-500" />
          </Button>
        </div>
        </Link>

        {/* 商品信息 */}
        <div className="p-4 space-y-2">
          <Link href={`/products/${id}`}>
            <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
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
                    className={`h-3.5 w-3.5 transition-all ${
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-600 font-medium">
                {rating} ({reviews})
              </span>
            </div>
          )}

          {/* 价格 */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                ¥{price}
              </span>
              {originalPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ¥{originalPrice}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-red-100 text-red-700 border-0">
                    -{Math.round((1 - price / originalPrice) * 100)}%
                  </Badge>
                </>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}