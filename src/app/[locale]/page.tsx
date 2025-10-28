/**
 * 首页组件 - shadcn/ui版本
 * 网站主页，展示特色商品、分类、优惠活动等
 */

'use client';

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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { useProducts } from '@/hooks/use-products';
import ProductCard from '@/components/products/product-card';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

export default function HomePage() {
  const { t } = useStaticTranslations('common');
  // 直接传递参数给 hook，它会自动获取数据
  const { products, loading } = useProducts({ limit: 8 });
  const { addItem } = useCartStore();

  // 添加到购物车
  const handleAddToCart = async (product: { id: string; name: string; price: number; image?: string }) => {
    // 添加到本地购物车（Zustand store）
    addItem({
      productId: product.id,
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.image || '/placeholder.png',
    });
    
    // 如果用户已登录，同步到服务器
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });
      
      if (response.ok) {
        toast.success('已添加到购物车');
      } else {
        // 如果是未登录，只显示本地添加成功
        const data = await response.json();
        if (data.error === 'UNAUTHORIZED') {
          toast.success('已添加到购物车（未同步）');
        } else {
          toast.success('已添加到购物车');
        }
      }
    } catch (error) {
      // 网络错误，但本地已添加
      console.error('Sync cart failed:', error);
      toast.success('已添加到购物车');
    }
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold text-white">
              {t('heroTitle')}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
              {t('heroSubtitle')}
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/products">{t('shopNow')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/about">{t('learnMore')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-600">{t('features.subtitle')}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>{t('features.quality.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('features.quality.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>{t('features.secure.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('features.secure.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>{t('features.fast.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('features.fast.description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              {t('categories.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: t('categories.fashion'),
                href: '/products?category=clothing',
                icon: Crown,
                count: 256,
              },
              {
                name: t('categories.electronics'),
                href: '/products?category=electronics',
                icon: Smartphone,
                count: 189,
              },
              {
                name: t('categories.home'),
                href: '/products?category=home',
                icon: Home,
                count: 432,
              },
              {
                name: t('categories.beauty'),
                href: '/products?category=beauty',
                icon: Palette,
                count: 98,
              },
            ].map(category => {
              const IconComponent = category.icon;
              return (
                <Link key={category.name} href={category.href}>
                  <Card className="cursor-pointer text-center transition-all hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-3 flex justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <h5 className="mb-2 text-lg font-medium text-gray-900">
                        {category.name}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {t('categories.itemCount', { count: category.count })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-green-600">1.2M+</div>
              <div className="text-gray-600">{t('stats.users')}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-red-600">50K+</div>
              <div className="text-gray-600">{t('stats.products')}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-blue-600">2K+</div>
              <div className="text-gray-600">{t('stats.brands')}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-purple-600">98.5%</div>
              <div className="text-gray-600">{t('stats.satisfaction')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">
                  {t('featuredProducts')}
                </h2>
              </div>
              <p className="text-lg text-gray-600">
                {t('qualityProducts')}, {t('qualityAssurance')}
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                {t('viewAll')}
                <Star className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Products Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h2 className="text-3xl font-bold text-gray-900">
                  {t('newArrivals')}
                </h2>
              </div>
              <p className="text-lg text-gray-600">
                {t('newReleases')}, {t('exclusiveExperience')}
              </p>
            </div>
            <Link href="/products?sort=newest">
              <Button variant="outline" className="gap-2">
                {t('viewMore')}
                <Star className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(4, 8).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            {t('cta.title')}
          </h2>
          <p className="mb-8 text-xl text-blue-100">{t('cta.subtitle')}</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link href="/register">{t('cta.register')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link href="/products">{t('cta.browse')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
