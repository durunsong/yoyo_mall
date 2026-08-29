'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Gift, TrendingDown, Percent, Sparkles, Star } from 'lucide-react';
import ProductCard from '@/components/products/product-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { toast } from 'sonner';
import { addProductToServerCart } from '@/lib/cart/client';
import { createTranslator, type TranslationDictionary } from '@/lib/i18n/dictionary';
import type { HomepageProduct } from '@/types/product';

interface DealsPageClientProps {
  initialProducts: HomepageProduct[];
  translations: {
    common: TranslationDictionary;
    product: TranslationDictionary;
  };
  currencySymbol: string;
}

export function DealsPageClient({
  initialProducts,
  translations,
  currencySymbol,
}: DealsPageClientProps) {
  const tCommon = useMemo(() => createTranslator(translations.common), [translations.common]);
  const tProduct = useMemo(() => createTranslator(translations.product), [translations.product]);
  const products = initialProducts;
  const discountedProducts = useMemo(
    () =>
      products.filter((product) => product.originalPrice && product.originalPrice > product.price),
    [products],
  );
  const averageDiscount = useMemo(() => {
    if (discountedProducts.length === 0) return 0;
    const total = discountedProducts.reduce((sum, product) => {
      if (!product.originalPrice) return sum;
      return sum + ((product.originalPrice - product.price) / product.originalPrice) * 100;
    }, 0);
    return Math.round(total / discountedProducts.length);
  }, [discountedProducts]);
  const maxDiscount = useMemo(() => {
    if (discountedProducts.length === 0) return 0;
    return discountedProducts.reduce((max, product) => {
      if (!product.originalPrice) return max;
      const percent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      return Math.max(max, percent);
    }, 0);
  }, [discountedProducts]);
  const totalSavings = useMemo(() => {
    return discountedProducts.reduce((sum, product) => {
      if (!product.originalPrice) return sum;
      return sum + (product.originalPrice - product.price);
    }, 0);
  }, [discountedProducts]);

  const { addItem, openCart } = useCartStore();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const wishlistStore = useWishlistStore();
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [cartLoadingId, setCartLoadingId] = useState<string | null>(null);

  const handleAddToCart = async (product: HomepageProduct) => {
    if (cartLoadingId) return;
    if (!session?.user) {
      openModal('login');
      toast.info(tProduct('toast.loginRequired'));
      return;
    }

    setCartLoadingId(product.id);
    try {
      const serverItem = await addProductToServerCart(product.id) as { id?: string } | undefined;
      if (serverItem) {
        addItem({
          id: serverItem.id,
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          image: product.image || product.images?.[0]?.url || 'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png',
        });
        toast.success(tProduct('toast.addSuccess'));
        openCart();
      } else {
        toast.error(tProduct('toast.addFailed'));
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast.error(tProduct('toast.networkError'));
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!session?.user) {
      openModal('login');
      toast.info(tProduct('toast.wishlistLogin'));
      return;
    }

    const existingItem = wishlistStore.items.find(item => item.productId === productId);

    try {
      setWishlistLoadingId(productId);

      if (existingItem) {
        const response = await fetch(`/api/wishlist/${existingItem.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (response.ok && data.success) {
          wishlistStore.removeItem(existingItem.id);
          toast.success(tProduct('toast.wishlistRemoved'));
        } else {
          toast.error(data.error || tProduct('toast.wishlistFailed'));
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const product = products.find(p => p.id === productId);
          const wishlistItem = data.data;

          if (product) {
            wishlistStore.addItem({
              id: wishlistItem?.id,
              productId: product.id,
              name: product.name,
              price: product.price,
              image:
                product.images?.[0]?.url ||
                (product as any).image ||
                wishlistItem?.product?.images?.[0]?.url ||
                'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png',
              addedAt: wishlistItem?.createdAt
                ? new Date(wishlistItem.createdAt)
                : undefined,
            });
          }
          toast.success(tProduct('toast.wishlistAdded'));
        } else {
          toast.error(data.message || data.error || tProduct('toast.wishlistFailed'));
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      toast.error(tProduct('toast.operationFailed'));
    } finally {
      setWishlistLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TrendingDown className="h-8 w-8" />
                <h1 className="text-3xl font-bold">
                  {tCommon('deals')}
                </h1>
              </div>
              <p className="text-lg text-red-100">
                {tCommon('dealsDescription')}
              </p>
            </div>
            <div className="hidden md:block">
              <Badge variant="secondary" className="bg-white px-6 py-3 text-2xl font-bold text-red-600">
                <Percent className="mr-2 h-6 w-6" />
                {tCommon('dealsLimitedOffer')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {tCommon('dealsStats.totalDeals')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <p className="text-xs text-gray-600">
                {tCommon('dealsStats.totalDealsDesc', { count: products.length })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {tCommon('dealsStats.averageDiscount')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {averageDiscount}%
              </div>
              <p className="text-xs text-gray-600">{tCommon('dealsStats.offLabel')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {tCommon('dealsStats.maxDiscount')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {maxDiscount}%
              </div>
              <p className="text-xs text-gray-600">{tCommon('dealsStats.offLabel')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {tCommon('dealsStats.savings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currencySymbol}
                {totalSavings.toFixed(0)}
              </div>
              <p className="text-xs text-gray-600">{tCommon('dealsStats.savingsDesc')}</p>
            </CardContent>
          </Card>
        </div>

        {products.length > 0 ? (
          <div className="space-y-8">
            <Card className="bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {tCommon('hotDealsTitle') || tCommon('deals')}
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    {tCommon('dealsDescription')}
                  </p>
                </div>
                <Link href="/products?sort=discount">
                  <Button variant="outline" className="gap-2">
                    {tCommon('viewAll')}
                    <Star className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onAddToWishlist={() => handleToggleWishlist(product.id)}
                    isWishlisted={wishlistStore.items.some(item => item.productId === product.id)}
                    wishlistLoading={wishlistLoadingId === product.id}
                    addToCartLoading={cartLoadingId === product.id}
                  />
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Gift className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {tCommon('dealsEmptyTitle')}
            </h3>
            <p className="text-gray-600">
              {tCommon('dealsEmptyDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
