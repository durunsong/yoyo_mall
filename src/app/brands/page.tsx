/**
 * 品牌页面
 * 展示所有品牌
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  _count?: {
    products: number;
  };
}

export default function BrandsPage() {
  const { t } = useStaticTranslations('common');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        if (data.success) {
          setBrands(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
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
            {t('brands') || '品牌中心'}
          </h1>
          <p className="text-gray-600">
            浏览所有品牌，发现优质产品
          </p>
        </div>

        {/* 品牌网格 */}
        {brands.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {brands.map((brand) => (
              <Link key={brand.id} href={`/products?brand=${brand.id}`}>
                <Card className="group transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="h-12 w-12 object-contain" />
                      ) : (
                        <Star className="h-8 w-8" />
                      )}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                      {brand.name}
                    </h3>
                    {brand.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                        {brand.description}
                      </p>
                    )}
                    {brand._count && (
                      <Badge variant="secondary">
                        {brand._count.products} 个商品
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 text-4xl text-gray-300">⭐</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              暂无品牌
            </h3>
            <p className="text-gray-600">
              目前还没有任何品牌
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

