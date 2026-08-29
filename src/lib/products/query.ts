export type ProductQueryOverrides = {
  search?: string;
  category?: string;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  reset?: boolean;
};

type BuildProductQueryOptions = {
  pathname: string;
  currentSearch?: string;
  overrides?: ProductQueryOverrides;
};

export function buildProductSearchHref(value: string, pathname = '/products'): string {
  const search = value.trim();
  if (!search) return pathname;
  const params = new URLSearchParams({ search });
  return `${pathname}?${params.toString()}`;
}

export function buildProductQueryString({
  pathname,
  currentSearch = '',
  overrides = {},
}: BuildProductQueryOptions): string {
  if (overrides.reset) {
    return pathname;
  }

  const current = new URLSearchParams(currentSearch);
  const params = new URLSearchParams();
  const search = overrides.search !== undefined ? overrides.search : current.get('search') ?? '';
  const category = overrides.category !== undefined ? overrides.category : current.get('category') ?? '';
  const sortBy = overrides.sortBy !== undefined ? overrides.sortBy : current.get('sortBy') ?? '';
  const sortOrder = overrides.sortOrder !== undefined ? overrides.sortOrder : current.get('sortOrder') ?? '';
  const page = overrides.page !== undefined ? overrides.page : Number(current.get('page') || 1);
  const limit = overrides.limit !== undefined ? overrides.limit : Number(current.get('limit') || 10);

  if (search.trim()) params.set('search', search.trim());
  if (category && category !== 'all') params.set('category', category);
  if (sortBy && sortOrder && !(sortBy === 'createdAt' && sortOrder === 'desc')) {
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
  }
  if (page > 1) params.set('page', String(page));
  if (limit !== 10) params.set('limit', String(limit));

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
