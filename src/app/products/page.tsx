/**
 * 商品列表页面 - 新风格（shadcn/ui）
 * - 工具栏：分类筛选 + 排序
 * - 卡片：角标/评分/悬浮快捷操作/库存遮罩
 */

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heart, Eye, ShoppingCart, Star, Search } from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  category: 'clothing' | 'electronics' | 'home' | 'beauty';
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    price: 999,
    originalPrice: 1099,
    rating: 4.8,
    reviews: 256,
    inStock: true,
    category: 'electronics',
  },
  {
    id: '2',
    name: 'MacBook Air M3',
    price: 1199,
    rating: 4.9,
    reviews: 189,
    inStock: true,
    category: 'electronics',
  },
  {
    id: '3',
    name: 'AirPods Pro',
    price: 249,
    originalPrice: 279,
    rating: 4.7,
    reviews: 432,
    inStock: false,
    category: 'electronics',
  },
  {
    id: '4',
    name: 'Designer T-Shirt',
    price: 69,
    rating: 4.5,
    reviews: 88,
    inStock: true,
    category: 'clothing',
  },
  {
    id: '5',
    name: 'Home Smart Lamp',
    price: 49,
    rating: 4.2,
    reviews: 45,
    inStock: true,
    category: 'home',
  },
  {
    id: '6',
    name: 'Beauty Care Set',
    price: 129,
    rating: 4.6,
    reviews: 120,
    inStock: true,
    category: 'beauty',
  },
];

export default function ProductsPage() {
  const { t } = useStaticTranslations('product');
  const { t: tCommon } = useStaticTranslations('common');

  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | Product['category']>('all');
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest'>('default');

  const categories = useMemo(
    () => ([
      { key: 'all', label: t('allCategories') },
      { key: 'clothing', label: t('clothingAccessories') },
      { key: 'electronics', label: t('phoneDigital') },
      { key: 'home', label: t('homeLiving') },
      { key: 'beauty', label: t('beauty') || 'Beauty' },
    ]) as { key: 'all' | Product['category']; label: string }[],
    [t]
  );

  const filtered = useMemo(() => {
    let list = [...MOCK_PRODUCTS];
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(k));
    }
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price); break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price); break;
      case 'rating-desc':
        list.sort((a, b) => b.rating - a.rating); break;
      default:
        break;
    }
    return list;
  }, [activeCategory, keyword, sort]);

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
              placeholder={t('searchPlaceholder')}
              className="pl-9"
            />
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('defaultSort')}</span>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('defaultSort')}</SelectItem>
                <SelectItem value="price-asc">{t('priceLowToHigh')}</SelectItem>
                <SelectItem value="price-desc">{t('priceHighToLow')}</SelectItem>
                <SelectItem value="rating-desc">{t('highestRated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* 分类筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(c => (
            <Button
              key={c.key}
              variant={activeCategory === c.key ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(c.key)}
              className="rounded-full"
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 统计 */}
      <div className="mb-4 text-sm text-muted-foreground">
        {t('totalProducts', { count: filtered.length })}
      </div>

      {/* 商品网格 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <Card key={product.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
            {/* 图片区 */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
              {/* 角标：特价 */}
              {product.originalPrice && (
                <Badge variant="destructive" className="absolute left-3 top-3 z-10">
                  {t('specialPrice')}
                </Badge>
              )}

              {/* 悬浮操作 */}
              <div className="pointer-events-none absolute right-3 top-3 z-10 flex translate-y-[-8px] flex-col gap-2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* 图片占位 */}
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-white/70 text-xs text-muted-foreground">
                  {t('productImage')}
                </div>
              </div>

              {/* 缺货遮罩 */}
              {!product.inStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-white">
                  <span className="text-sm font-medium">{t('outOfStock')}</span>
                </div>
              )}
            </div>

            <CardContent className="space-y-3 p-4">
              {/* 标题 */}
              <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>

              {/* 评分 */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews})</span>
              </div>

              {/* 价格区 */}
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-blue-600">¥{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">¥{product.originalPrice}</span>
                  )}
                </div>
                <Button size="sm" disabled={!product.inStock}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.inStock ? t('addToCart') : t('outOfStock')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
