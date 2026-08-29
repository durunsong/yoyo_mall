'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import ProductCard from '@/components/products/product-card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { createTranslator, type TranslationDictionary } from '@/lib/i18n/dictionary';
import type { HomepageProduct } from '@/types/product';
import type { CategorySummary } from '@/types/category';
import type { ProductListPagination, ProductListQuery } from '@/lib/server/products';
import { buildProductQueryString } from '@/lib/products/query';
import { addProductToServerCart } from '@/lib/cart/client';

interface ProductsPageClientProps {
  initialProducts: HomepageProduct[];
  initialPagination: ProductListPagination;
  categories: CategorySummary[];
  initialQuery: ProductListQuery;
  translations: TranslationDictionary;
}

const DEFAULT_LIMIT = 10;

export function ProductsPageClient({
  initialProducts,
  initialPagination,
  categories,
  initialQuery,
  translations,
}: ProductsPageClientProps) {
  const t = useMemo(() => createTranslator(translations), [translations]);
  const router = useRouter();
  const pathname = usePathname() ?? '/products';
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const wishlistStore = useWishlistStore();
  const { openModal } = useAuthModal();
  const { addItem, openCart } = useCartStore();

  const [keyword, setKeyword] = useState(initialQuery.search ?? '');
  const [activeCategory, setActiveCategory] = useState(initialQuery.category ?? 'all');
  const [sort, setSort] = useState(
    initialQuery.sortBy && initialQuery.sortOrder
      ? `${initialQuery.sortBy}-${initialQuery.sortOrder}`
      : 'default',
  );
  const [currentPage, setCurrentPage] = useState(initialQuery.page ?? 1);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [cartLoadingId, setCartLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setKeyword(initialQuery.search ?? '');
    setActiveCategory(initialQuery.category ?? 'all');
    setSort(
      initialQuery.sortBy && initialQuery.sortOrder
        ? `${initialQuery.sortBy}-${initialQuery.sortOrder}`
        : 'default',
    );
    setCurrentPage(initialQuery.page ?? 1);
  }, [initialQuery.search, initialQuery.category, initialQuery.sortBy, initialQuery.sortOrder, initialQuery.page]);

  const navigateWithQuery = (overrides: Partial<ProductListQuery>) => {
    startTransition(() => {
      router.push(
        buildProductQueryString({
          pathname,
          currentSearch: searchParams?.toString(),
          overrides,
        }),
      );
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    navigateWithQuery({ search: keyword.trim(), page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
    navigateWithQuery({
      category,
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    const [sortBy, sortOrder] = value.split('-');
    if (value === 'default') {
      navigateWithQuery({ sortBy: 'createdAt', sortOrder: 'desc', page: 1 });
      return;
    }
    navigateWithQuery({ sortBy: sortBy as ProductListQuery['sortBy'], sortOrder: sortOrder as ProductListQuery['sortOrder'], page: 1 });
  };

  const handleResetFilters = () => {
    setKeyword('');
    setActiveCategory('all');
    setSort('default');
    setCurrentPage(1);
    startTransition(() => router.push(pathname));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    navigateWithQuery({ page });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = async (product: { id: string; name: string; price: number; image?: string }) => {
    if (cartLoadingId) return;
    if (!session?.user) {
      openModal('login');
      toast.info(t('toast.loginRequired'));
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
        toast.success(t('toast.addSuccess'));
        openCart();
      } else {
        toast.error(t('toast.addFailed'));
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast.error(t('toast.networkError'));
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!session?.user) {
      openModal('login');
      toast.info(t('toast.wishlistLogin'));
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
          toast.success(t('toast.wishlistRemoved'));
        } else {
          toast.error(data.error || t('toast.wishlistFailed'));
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const product = initialProducts.find((p) => p.id === productId);
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
          toast.success(t('toast.wishlistAdded'));
        } else {
          toast.error(data.error || data.message || t('toast.wishlistFailed'));
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      toast.error(t('toast.operationFailed'));
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const effectiveLimit = initialPagination.limit ?? initialQuery.limit ?? DEFAULT_LIMIT;
  const effectiveTotalPages = Math.max(1, Math.ceil((initialPagination.total ?? 0) / effectiveLimit));

  return (
    <div className="container mx-auto px-4 py-8" aria-busy={isPending}>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t('productList')}</h1>
        <p className="text-gray-600">{t('discoverProducts')}</p>
      </div>

      <Card className="mb-6 shadow-sm">
        <CardContent className="space-y-4 py-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  clearable
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onClear={() => {
                    setKeyword('');
                    navigateWithQuery({ search: '', page: 1 });
                  }}
                  placeholder={t('searchPlaceholder') || 'Search products...'}
                  className="pl-9 pr-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('sort') || 'Sort by'}:</span>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('defaultSort') || 'Default'}</SelectItem>
                  <SelectItem value="price-asc">{t('priceLowToHigh') || 'Price: Low to High'}</SelectItem>
                  <SelectItem value="price-desc">{t('priceHighToLow') || 'Price: High to Low'}</SelectItem>
                  <SelectItem value="createdAt-desc">{t('newest') || 'Newest'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              key="all"
              variant={activeCategory === 'all' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleCategoryChange('all')}
              className="rounded-full"
            >
              {t('allCategories') || 'All'}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.slug ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleCategoryChange(category.slug)}
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
            {(keyword || activeCategory !== 'all' || sort !== 'default') && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} disabled={isPending}>
                {t('resetFilters') || 'Reset filters'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {initialPagination && (
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          {t('totalProducts', { count: initialPagination.total })}
          {isPending && <span role="status">{t('loading') || 'Loading...'}</span>}
        </div>
      )}

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden="true">
          {Array.from({ length: effectiveLimit }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border bg-card">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-6 w-2/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : initialProducts.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {initialProducts.map((product) => (
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

          {effectiveTotalPages > 1 && (
            <div className="mt-8">
              <PaginationControls
                currentPage={currentPage}
                totalPages={effectiveTotalPages}
                onPageChange={handlePageChange}
              />
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('rangeText', {
                  start: (currentPage - 1) * effectiveLimit + 1,
                  end: Math.min(currentPage * effectiveLimit, initialPagination.total),
                  total: initialPagination.total,
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center">
          <div className="mb-4 text-4xl text-gray-300">🔍</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {t('noProducts') || 'No products found'}
          </h3>
          <p className="text-gray-600">{t('tryDifferentFilters')}</p>
        </div>
      )}
    </div>
  );
}
