import Link from 'next/link';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getActiveCategories } from '@/lib/server/categories';
import { getSystemSettings } from '@/lib/server/system-settings';
import { getDictionaries } from '@/lib/server/translations';
import { createTranslator } from '@/lib/i18n/dictionary';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const [categories, settings] = await Promise.all([
    getActiveCategories(),
    getSystemSettings(),
  ]);
  const locale = settings.defaultLanguage || 'en-US';
  const dictionaries = await getDictionaries(locale, ['common']);
  const t = createTranslator(dictionaries.common);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-widest text-blue-600">
            {t('categories')}
          </p>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            {t('categoriesDescription')}
          </h1>
          <p className="max-w-2xl text-gray-600">
            {t('categoriesSubtitle') || t('categoriesDescription')}
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug ?? category.id}`}>
                <Card className="group h-full transition-shadow hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <Package className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                        {category.description}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-auto w-max">
                      {t('productsCount', { count: category.productCount ?? 0 })}
                    </Badge>
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



