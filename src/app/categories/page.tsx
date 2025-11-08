/**
 * 分类页面
 * 展示所有商品分类
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package } from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const { t } = useStaticTranslations('common');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 标题骨架 */}
          <div className="mb-8">
            <div className="skeleton-wave mb-2 h-9 w-48 rounded" />
            <div className="skeleton-wave h-5 w-80 rounded" />
          </div>

          {/* 分类卡片骨架网格 */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* 图标骨架 */}
                  <div className="skeleton-wave mb-4 h-16 w-16 rounded-lg" />
                  {/* 标题骨架 */}
                  <div className="skeleton-wave mb-2 h-6 w-32 rounded" />
                  {/* 描述骨架 */}
                  <div className="mb-3 space-y-2">
                    <div className="skeleton-wave h-4 w-full rounded" />
                    <div className="skeleton-wave h-4 w-24 rounded" />
                  </div>
                  {/* 徽章骨架 */}
                  <div className="skeleton-wave h-5 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t('categories')}
          </h1>
          <p className="text-gray-600">
            {t('categoriesDescription')}
          </p>
        </div>

        {/* 分类网格 */}
        {categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="group transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <Package className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                        {category.description}
                      </p>
                    )}
                    {category._count && (
                      <Badge variant="secondary">
                        {t('productsCount', { count: category._count.products })}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 text-4xl text-gray-300">📦</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('categoriesEmptyTitle')}
            </h3>
            <p className="text-gray-600">
              {t('categoriesEmptyDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}




