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
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStaticTranslations } from '@/hooks/use-i18n';

export default function HomePage() {
  const { t } = useStaticTranslations('common');

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
