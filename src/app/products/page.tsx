import { ProductsPageClient } from '@/components/products/product-list-client';
import { getProductList, type ProductListQuery } from '@/lib/server/products';
import { getActiveCategories } from '@/lib/server/categories';
import { getSystemSettings } from '@/lib/server/system-settings';
import { getDictionaries } from '@/lib/server/translations';

export const revalidate = 300;

type ProductsSearchParams = Record<string, string | string[] | undefined>;

interface ProductsPageProps {
  searchParams?: ProductsSearchParams | Promise<ProductsSearchParams | undefined>;
}

function parseQuery(searchParams?: ProductsSearchParams): ProductListQuery {
  if (!searchParams) return {};

  const getParam = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value ?? undefined;
  };

  const pageParam = getParam('page');
  const limitParam = getParam('limit');

  const page = pageParam ? Number(pageParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  return {
    page: Number.isNaN(page) ? undefined : page,
    limit: Number.isNaN(limit) ? undefined : limit,
    search: getParam('search') || undefined,
    category: getParam('category') || undefined,
    sortBy: (getParam('sortBy') as ProductListQuery['sortBy']) || undefined,
    sortOrder: (getParam('sortOrder') as ProductListQuery['sortOrder']) || undefined,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = parseQuery(resolvedSearchParams);

  const settings = await getSystemSettings();
  const locale = settings.defaultLanguage || 'en-US';

  const [productList, categories, dictionaries] = await Promise.all([
    getProductList(query),
    getActiveCategories(),
    getDictionaries(locale, ['product']),
  ]);

  return (
    <ProductsPageClient
      initialProducts={productList.products}
      initialPagination={productList.pagination}
      categories={categories}
      initialQuery={{
        page: productList.pagination.page,
        limit: productList.pagination.limit,
        search: query.search,
        category: query.category ?? 'all',
        sortBy: productList.appliedFilters.sortBy,
        sortOrder: productList.appliedFilters.sortOrder,
      }}
      translations={dictionaries.product}
    />
  );
}


