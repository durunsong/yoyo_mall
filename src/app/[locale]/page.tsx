import { HomePageClient } from '@/components/home/home-page-client';
import { getDictionaries } from '@/lib/server/translations';
import { getHomepageProducts } from '@/lib/server/products';
import { getTopCategories } from '@/lib/server/categories';

const PRODUCT_LIMIT = 10;
const FEATURED_LIMIT = 5;

interface HomePageProps {
  params: { locale: string };
}

export const revalidate = 60;

export default async function HomePage({ params }: HomePageProps) {
  const locale = params?.locale || 'en-US';

  const [products, translations, categories] = await Promise.all([
    getHomepageProducts(PRODUCT_LIMIT),
    getDictionaries(locale, ['common', 'home']),
    getTopCategories(8),
  ]);

  const featuredProducts = products.slice(0, FEATURED_LIMIT);
  const newArrivalProducts = products.slice(FEATURED_LIMIT);
  const effectiveNewArrivals = newArrivalProducts.length > 0 ? newArrivalProducts : featuredProducts;

  return (
    <HomePageClient
      locale={locale}
      translations={{
        common: translations.common,
        home: translations.home,
      }}
      featuredProducts={featuredProducts}
      newArrivalProducts={effectiveNewArrivals}
      categories={categories}
    />
  );
}


