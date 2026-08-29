'use client';

import Link from 'next/link';
import { Heart, Loader2, ShoppingCart, Star } from 'lucide-react';

import { useStaticTranslations } from '@/hooks/use-i18n';
import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    images?: Array<{ url: string }>;
    rating?: number;
    reviews?: number | Array<{ rating: number }>;
    inStock?: boolean;
    featured?: boolean;
  };
  onAddToCart?: (product: { id: string; name: string; price: number; image?: string }) => void | Promise<void>;
  onAddToWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
  wishlistLoading?: boolean;
  addToCartLoading?: boolean;
  className?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  isWishlisted = false,
  wishlistLoading = false,
  addToCartLoading = false,
  className = '',
}: ProductCardProps) {
  const { t } = useStaticTranslations('common');
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  const primaryImage = product.image || product.images?.[0]?.url;
  const reviewCount = Array.isArray(product.reviews) ? product.reviews.length : product.reviews ?? 0;
  const inStock = product.inStock ?? true;

  return (
    <Card className={`group relative overflow-hidden transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/products/${product.id}`} className="block" aria-label={product.name}>
            <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t('productImagePlaceholder')}
                </div>
              )}

              {!inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <span className="font-semibold text-white">{t('outOfStock')}</span>
                </div>
              )}

              {product.featured && (
                <Badge className="absolute left-2 top-2 bg-amber-500 text-white">{t('featured')}</Badge>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <Badge className="absolute left-2 top-2 bg-rose-600 text-white">{t('specialOffer')}</Badge>
              )}
            </div>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
            aria-pressed={isWishlisted}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 h-9 w-9 bg-white/90 shadow-sm transition-opacity focus-visible:opacity-100 ${
              isWishlisted ? 'text-rose-600 opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={() => onAddToWishlist?.(product.id)}
          >
            <Heart className={isWishlisted ? 'fill-current' : ''} />
          </Button>

          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button
              type="button"
              className="w-full shadow-md"
              disabled={!inStock || addToCartLoading}
              onClick={() => onAddToCart?.({
                id: product.id,
                name: product.name,
                price: product.price,
                image: primaryImage,
              })}
            >
              {addToCartLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
              {addToCartLoading ? t('addingToCart') : t('addToCart')}
            </Button>
          </div>
        </div>

        <div className="flex min-h-[156px] flex-col gap-2 p-4">
          <Link href={`/products/${product.id}`} className="line-clamp-2 font-semibold text-foreground hover:text-primary">
            {product.name}
          </Link>

          {product.rating && product.rating > 0 ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="flex items-center" aria-label={`${product.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`h-3.5 w-3.5 ${index < Math.floor(product.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                ))}
              </span>
              <span>{product.rating.toFixed(1)} ({reviewCount})</span>
            </div>
          ) : <div className="h-5" aria-hidden="true" />}

          <div className="mt-auto flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums text-primary">{currencySymbol}{product.price.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-sm tabular-nums text-muted-foreground line-through">{currencySymbol}{product.originalPrice.toFixed(2)}</span>
                <span className="text-xs font-medium text-rose-600">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
