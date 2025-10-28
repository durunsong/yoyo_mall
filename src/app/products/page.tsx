/**
 * 商品列表页面 - 完整功能版本
 * - 真实API数据获取
 * - 分类筛选 + 排序
 * - 分页功能
 * - 搜索功能
 * - 响应式设计
 */

'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { Pagination } from '@/components/ui/pagination';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

function ProductsPageContent() {
  const { t } = useStaticTranslations('product');
  const { t: tCommon } = useStaticTranslations('common');
  const searchParams = useSearchParams();
  
  // 从URL参数初始化搜索关键词
  const initialSearch = searchParams.get('search') || '';
  
  // 状态管理
  const [keyword, setKeyword] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  
  // 使用产品Hook
  const { products, loading, pagination, refetch } = useProducts();
  const { addItem } = useCartStore();

  // 添加到购物车
  const handleAddToCart = (product: { id: string; name: string; price: number; image?: string }) => {
    addItem({
      productId: product.id,
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.image || '/placeholder.png',
    });
    toast.success('已添加到购物车');
  };

  // 添加到心愿单
  const handleAddToWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('已添加到心愿单');
      } else {
        toast.error(data.message || '添加失败');
      }
    } catch (error) {
      console.error('Add to wishlist failed:', error);
      toast.error('添加失败，请重试');
    }
  };

  // 监听URL参数变化，更新搜索关键词
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam && searchParam !== keyword) {
      setKeyword(searchParam);
    }
  }, [searchParams]);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          setCategories([
            { id: 'all', name: t('allCategories') || 'All', slug: 'all' },
            ...data.data
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

    if (activeCategory && activeCategory !== 'all') {
      params.category = activeCategory;
    }

    // 排序处理
    if (sort !== 'default') {
      const [sortBy, sortOrder] = sort.split('-');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
    }

    refetch(params);
  }, [currentPage, keyword, activeCategory, sort, refetch]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t('productList')}</h1>
        <p className="text-gray-600">{t('discoverProducts')}</p>
      </div>

      {/* 工具栏 */}
      <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
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
          {categories.map(c => (
            <Button
              key={c.id}
              variant={activeCategory === c.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(c.id)}
              className="rounded-full"
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 统计 */}
      {pagination && (
        <div className="mb-4 text-sm text-muted-foreground">
          {t('totalProducts', { count: pagination.total }) || `Total: ${pagination.total} products`}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      )}

      {/* 商品网格 */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
              />
            ))}
          </div>

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  {tCommon('previous') || 'Previous'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  {tCommon('next') || 'Next'}
                </Button>
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
            {t('tryDifferentSearch') || 'Try adjusting your search or filters'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
