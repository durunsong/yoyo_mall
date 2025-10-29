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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
            {t('categories') || '商品分类'}
          </h1>
          <p className="text-gray-600">
            浏览所有商品分类，找到您想要的产品
          </p>
        </div>

        {/* 分类网格 */}
        {categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                        {category._count.products} 个商品
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
              暂无分类
            </h3>
            <p className="text-gray-600">
              目前还没有任何分类
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



