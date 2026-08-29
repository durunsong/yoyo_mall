'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Shield,
  Zap,
  Crown,
  Smartphone,
  Home,
  Palette,
  Star,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { addProductToServerCart } from '@/lib/cart/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/products/product-card';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import type { TranslationDictionary } from '@/lib/i18n/dictionary';
import { createTranslator } from '@/lib/i18n/dictionary';
import type { HomepageProduct } from '@/types/product';
import type { CategorySummary } from '@/types/category';

interface HomePageClientProps {
  locale: string;
  translations: {
    common: TranslationDictionary;
    home: TranslationDictionary;
  };
  featuredProducts: HomepageProduct[];
  newArrivalProducts: HomepageProduct[];
  categories: CategorySummary[];
}

export function HomePageClient({
  translations,
  featuredProducts,
  newArrivalProducts,
  categories,
}: HomePageClientProps) {
  const t = useMemo(() => createTranslator(translations.common), [translations.common]);
  const tHome = useMemo(() => createTranslator(translations.home), [translations.home]);
  const iconSequence = [Crown, Smartphone, Home, Palette, ShoppingBag, Shield, Zap, Star];

  const baseFallbackCategories = useMemo(
    () => [
      {
        name: t('categories.fashion'),
        href: '/products?category=clothing',
        count: 256,
      },
      {
        name: t('categories.electronics'),
        href: '/products?category=electronics',
        count: 189,
      },
      {
        name: t('categories.home'),
        href: '/products?category=home',
        count: 432,
      },
      {
        name: t('categories.beauty'),
        href: '/products?category=beauty',
        count: 98,
      },
    ],
    [t],
  );

  const fallbackCategories = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, index) => {
        const base = baseFallbackCategories[index % baseFallbackCategories.length];
        const hrefWithFallback = `${base.href}${base.href.includes('?') ? '&' : '?'}fallback=${index}`;
        return {
          ...base,
          icon: iconSequence[index % iconSequence.length],
          href: hrefWithFallback,
        };
      }),
    [baseFallbackCategories, iconSequence],
  );

  const categoriesToRender = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, index) => {
        const category = categories[index];
        const fallback = fallbackCategories[index % fallbackCategories.length];
        const icon = iconSequence[index % iconSequence.length];
        const slug = category?.slug ?? category?.id;

        return {
          name: category?.name ?? fallback.name,
          href: slug ? `/products?category=${slug}` : fallback.href,
          icon,
          count: category?.productCount ?? fallback.count,
        };
      }),
    [categories, fallbackCategories, iconSequence],
  );

  const { addItem, openCart } = useCartStore();
  const wishlistStore = useWishlistStore();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [cartLoadingId, setCartLoadingId] = useState<string | null>(null);

  const combinedProductMap = useMemo(() => {
    const map = new Map<string, HomepageProduct>();
    featuredProducts.forEach((product) => map.set(product.id, product));
    newArrivalProducts.forEach((product) => map.set(product.id, product));
    return map;
  }, [featuredProducts, newArrivalProducts]);

  const hasProducts = featuredProducts.length > 0 || newArrivalProducts.length > 0;

  const handleAddToCart = async (product: { id: string; name: string; price: number; image?: string }) => {
    if (cartLoadingId) return;
    if (!session?.user) {
      openModal('login');
      toast.info(tHome('toast.loginRequired'));
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
          image: product.image || 'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png',
        });
        toast.success(tHome('toast.addSuccess'));
        openCart();
      } else {
        toast.error(tHome('toast.addFailed'));
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast.error(tHome('toast.networkError'));
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!session?.user) {
      openModal('login');
      toast.info(tHome('toast.loginWishlist'));
      return;
    }

    const existingItem = wishlistStore.items.find((item) => item.productId === productId);

    try {
      setWishlistLoadingId(productId);

      if (existingItem) {
        const response = await fetch(`/api/wishlist/${existingItem.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (response.ok && data.success) {
          wishlistStore.removeItem(existingItem.id);
          toast.success(tHome('toast.wishlistRemoved'));
        } else {
          toast.error(data.error || tHome('toast.wishlistFailed'));
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const product = combinedProductMap.get(productId);
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
              addedAt: wishlistItem?.createdAt ? new Date(wishlistItem.createdAt) : undefined,
            });
          }
          toast.success(tHome('toast.wishlistAdded'));
        } else {
          toast.error(data.message || data.error || tHome('toast.wishlistFailed'));
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      toast.error(tHome('toast.operationFailed'));
    } finally {
      setWishlistLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-10 text-white w-full overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
            <div className="max-w-2xl text-center lg:text-left">
              <h1 className="mb-6 text-4xl font-semibold leading-tight text-white md:text-5xl">
                {t('heroTitle')}
              </h1>
              <p className="mb-8 text-lg text-blue-100 md:text-xl">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                  <Link href="/products">{t('shopNow')}</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                  <Link href="/about">{t('learnMore')}</Link>
                </Button>
              </div>
            </div>

            <div className="h-64 w-full max-w-lg overflow-hidden rounded-3xl bg-white/10 p-6 backdrop-blur md:h-72">
              <div className="flex h-full w-full flex-col justify-between rounded-2xl bg-white/90 p-4 text-left text-gray-900">
                <div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                    {tHome('hotSale')}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-gray-900">{tHome('heroHighlightTitle')}</h3>
                  <p className="mt-2 text-sm text-gray-600">{tHome('heroHighlightDesc')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                    <div className="text-xl font-bold">50% OFF</div>
                    <div>{tHome('heroDiscount')}</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-purple-700">
                    <div className="text-xl font-bold">24h</div>
                    <div>{tHome('heroExpress')}</div>
                  </div>
                  <div className="col-span-2 rounded-lg bg-green-50 p-3 text-green-700 min-h-[48px]">
                    {tHome('heroAssurance')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: ShoppingBag,
                title: t('features.quality.title'),
                desc: t('features.quality.description'),
                bg: 'bg-blue-500/10',
              },
              {
                icon: Shield,
                title: t('features.secure.title'),
                desc: t('features.secure.description'),
                bg: 'bg-green-500/10',
              },
              {
                icon: Zap,
                title: t('features.fast.title'),
                desc: t('features.fast.description'),
                bg: 'bg-purple-500/10',
              },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl bg-white/10 p-6 backdrop-blur hover:bg-white/20"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${item.bg}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">{item.title}</div>
                    <p className="mt-2 text-sm text-blue-100">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-5 w-full overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">{t('experienceMore')}</h2>
            <p className="mt-3 text-lg text-gray-600">{t('categories.subtitle')}</p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <Card className="flex-1 border-none bg-white shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">{t('categories.title')}</CardTitle>
                    <CardDescription className="mt-2 text-gray-500">
                      {t('categories.subtitle')}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700">
                    {tHome('selectedCategories')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                  {categoriesToRender.map((category, index) => {
                    const IconComponent = category.icon ?? iconSequence[index % iconSequence.length];
                    return (
                      <Link key={`${category.href}-${index}`} href={category.href} className="group">
                        <div className="flex items-center gap-4 rounded-2xl border-transparent p-4 transition-all hover:border-blue-200 hover:bg-blue-50 shadow-sm">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-medium text-gray-900 group-hover:text-blue-600">{category.name}</p>
                            <p className="text-sm text-gray-500">
                              {t('categories.itemCount', { count: category.count })}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 border-none bg-gradient-to-br from-white via-white to-blue-50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gray-900">{tHome('dataHighlightTitle')}</CardTitle>
                <CardDescription className="mt-2 text-gray-500">
                  {tHome('dataHighlightDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {[
                      {
                        value: '1.2M+',
                        label: t('stats.users'),
                        color: 'text-green-600',
                      },
                      {
                        value: '50K+',
                        label: t('stats.products'),
                        color: 'text-red-600',
                      },
                      {
                        value: '98.5%',
                        label: t('stats.satisfaction'),
                        color: 'text-purple-600',
                      },
                      {
                        value: tHome('dataFastShipping'),
                        label: tHome('dataFastShippingDesc'),
                        color: 'text-blue-600',
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                        <div className="mt-2 text-sm text-gray-600">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-blue-600 p-6 text-white">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-1 h-6 w-6" />
                      <div>
                        <div className="text-lg font-semibold">{tHome('guaranteeTitle')}</div>
                        <p className="mt-2 text-sm text-blue-100">
                          {tHome('guaranteeDesc')}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="mt-4 bg-white text-blue-600 hover:bg-blue-100" asChild>
                      <Link href="/support">{tHome('learnMoreGuarantee')}</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-5 w-full overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1 text-sm font-medium text-purple-600">
              <Sparkles className="h-4 w-4" />
              {tHome('recommendTag')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900">{tHome('recommendTitle')}</h2>
            <p className="mt-3 text-lg text-gray-600">{tHome('recommendSubtitle')}</p>
          </div>

          <div className="space-y-12">
            {!hasProducts ? (
              <>
                {[1, 2].map((section) => (
                  <div key={section} className="rounded-3xl bg-white p-6 shadow-lg md:p-10">
                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-2 h-6 w-40 rounded skeleton-wave" />
                        <div className="h-4 w-56 rounded skeleton-wave" />
                      </div>
                      <div className="h-10 w-28 rounded-full skeleton-wave" />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
                          <div className="skeleton-wave aspect-[3/4] w-full rounded-xl" />
                          <div className="space-y-2">
                            <div className="skeleton-wave h-4 w-3/4 rounded" />
                            <div className="skeleton-wave h-4 w-1/2 rounded" />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="skeleton-wave h-5 w-20 rounded" />
                            <div className="skeleton-wave h-5 w-14 rounded" />
                          </div>
                          <div className="skeleton-wave h-9 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="rounded-3xl bg-white p-6 shadow-lg md:p-10">
                  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        <h3 className="text-2xl font-semibold text-gray-900">{t('featuredProducts')}</h3>
                      </div>
                      <p className="text-gray-600">
                        {t('qualityProducts')} · {t('qualityAssurance')}
                      </p>
                    </div>
                    <Link href="/products">
                      <Button variant="outline" className="gap-2">
                        {t('viewAll')}
                        <Star className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {featuredProducts.slice(0, 5).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleToggleWishlist}
                        isWishlisted={wishlistStore.items.some((item) => item.productId === product.id)}
                        wishlistLoading={wishlistLoadingId === product.id}
                        addToCartLoading={cartLoadingId === product.id}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-lg md:p-10">
                  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <h3 className="text-2xl font-semibold text-gray-900">{t('newArrivals')}</h3>
                      </div>
                      <p className="text-gray-600">
                        {t('newReleases')} · {t('exclusiveExperience')}
                      </p>
                    </div>
                    <Link href="/products?sort=newest">
                      <Button variant="outline" className="gap-2">
                        {t('viewMore')}
                        <Star className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {newArrivalProducts.slice(0, 5).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleToggleWishlist}
                        isWishlisted={wishlistStore.items.some((item) => item.productId === product.id)}
                        wishlistLoading={wishlistLoadingId === product.id}
                        addToCartLoading={cartLoadingId === product.id}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
