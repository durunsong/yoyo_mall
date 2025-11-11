/**
 * 商品列表页面 - 完整功能版本
 * - 真实API数据获取
 * - 分类筛选 + 排序
 * - 分页功能
 * - 搜索功能
 * - 响应式设计
 */

'use client';

import { useMemo, useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heart, Eye, ShoppingCart, Star, Search, Filter } from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { useProducts } from '@/hooks/use-products';
import ProductCard from '@/components/products/product-card';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { toast } from 'sonner';
import { PaginationControls } from '@/components/ui/pagination-controls';

function ProductsPageContent() {
  const { t } = useStaticTranslations('product');
  const searchParams = useSearchParams();
  const wishlistStore = useWishlistStore();
  const { data: session } = useSession(); // 添加session
  const { openModal } = useAuthModal(); // 添加登录弹窗
  
  // 从URL参数初始化搜索关键词和分类
  const initialSearch = searchParams?.get('search') || '';
  const initialCategory = searchParams?.get('category') || 'all';
  
  // 状态管理
  const [keyword, setKeyword] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sort, setSort] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  
  // 使用产品Hook
  const { products, loading, pagination, refetch } = useProducts();
  const { addItem } = useCartStore();
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  const resolvedCategoryId = useMemo(() => {
    if (!activeCategory || activeCategory === 'all') return 'all';
    const matchedCategory = categories.find((cat) => (cat?.slug || cat?.id) === activeCategory);
    return matchedCategory?.id || activeCategory;
  }, [categories, activeCategory]);

  // 添加到购物车 - 未登录时弹出登录框
  const handleAddToCart = async (product: { id: string; name: string; price: number; image?: string }) => {
    // 检查登录状态
    if (!session?.user) {
      openModal('login');
      toast.info(t('toast.loginRequired'));
      return;
    }

    try {
      // 调用API添加到服务端购物车
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 同时添加到本地store（用于UI显示）
        addItem({
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          image: product.image || 'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png',
        });
        toast.success(t('toast.addSuccess'));
      } else {
        toast.error(data.message || t('toast.addFailed'));
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast.error(t('toast.networkError'));
    }
  };

  // 添加到心愿单
  const handleToggleWishlist = async (productId: string) => {
    if (!session?.user) {
      openModal('login');
      toast.info(t('toast.wishlistLogin'));
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

  // 监听URL参数变化，更新搜索关键词和分类
  useEffect(() => {
    if (!searchParams) return;

    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    
    if (searchParam !== null && searchParam !== keyword) {
      setKeyword(searchParam);
    }
    
    if (categoryParam !== null && categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    }
    // 当URL缺少category参数时保持当前选中状态，避免手动点击后样式被重置
  }, [searchParams, keyword, activeCategory]);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          const normalized = (data.data || []).map((cat: any) => ({
            ...cat,
            slug: cat.slug || cat.id,
          }));
          setCategories([
            { id: 'all', slug: 'all', name: t('allCategories') || 'All' },
            ...normalized,
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, [t]);

  // 获取商品列表
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: 12,
    };

    if (keyword.trim()) {
      params.search = keyword.trim();
    }

    if (resolvedCategoryId && resolvedCategoryId !== 'all') {
      params.category = resolvedCategoryId;
    }

    // 排序处理
    if (sort !== 'default') {
      const [sortBy, sortOrder] = sort.split('-');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
    }

    refetchRef.current(params);
  }, [currentPage, keyword, resolvedCategoryId, sort]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t('productList')}</h1>
        <p className="text-gray-600">{t('discoverProducts')}</p>
      </div>

      {/* 工具栏 */}
      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-card p-4 shadow-sm">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          {/* 搜索框 */}
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('searchPlaceholder') || 'Search products...'}
              className="pl-9"
            />
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('sort') || 'Sort by'}:</span>
            <Select value={sort} onValueChange={(v) => setSort(v)}>
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
        </div>

        <Separator />

        {/* 分类筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {categories.map(c => {
            const categoryValue = c.slug || c.id;
            return (
              <Button
                key={c.id}
                variant={activeCategory === categoryValue ? 'default' : 'secondary'}
                size="sm"
                onClick={() => {
                  setActiveCategory(categoryValue);
                  setCurrentPage(1);
                }}
                className="rounded-full"
              >
                {c.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 统计 */}
      {pagination && (
        <div className="mb-4 text-sm text-muted-foreground">
          {t('totalProducts', { count: pagination.total })}
        </div>
      )}

      {/* 加载状态 - 5列骨架屏 */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
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
      )}

      {/* 商品网格 - 5列布局 */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleToggleWishlist}
                isWishlisted={wishlistStore.items.some(item => item.productId === product.id)}
                wishlistLoading={wishlistLoadingId === product.id}
              />
            ))}
          </div>

          {/* 分页控制 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <PaginationControls
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  // 滚动到页面顶部
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              
              {/* 显示当前范围 */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('rangeText', {
                  start: (currentPage - 1) * 12 + 1,
                  end: Math.min(currentPage * 12, pagination.total),
                  total: pagination.total,
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 空状态 */}
      {!loading && products.length === 0 && (
        <div className="py-16 text-center">
          <div className="mb-4 text-4xl text-gray-300">🔍</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {t('noProducts') || 'No products found'}
          </h3>
          <p className="text-gray-600">
            {t('tryDifferentFilters')}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useStaticTranslations('product');
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="mx-auto mb-4 h-12 w-12 animate-spin text-gray-900" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="text-gray-600">{t('loadingProducts')}</p>
            </div>
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
