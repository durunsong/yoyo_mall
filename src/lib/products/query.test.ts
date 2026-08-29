import { buildProductQueryString, buildProductSearchHref } from '@/lib/products/query';

describe('buildProductQueryString', () => {
  it('clears all catalog filters when reset is requested', () => {
    expect(
      buildProductQueryString({
        pathname: '/products',
        currentSearch: 'search=phone&category=mobile&sortBy=price&sortOrder=asc&page=3',
        overrides: { reset: true },
      }),
    ).toBe('/products');
  });

  it('preserves the active filter while returning to the first page', () => {
    expect(
      buildProductQueryString({
        pathname: '/products',
        currentSearch: 'category=mobile&page=3',
        overrides: { page: 1 },
      }),
    ).toBe('/products?category=mobile');
  });
});

describe('buildProductSearchHref', () => {
  it('encodes a trimmed search term once', () => {
    expect(buildProductSearchHref('  red shoes  ')).toBe('/products?search=red+shoes');
    expect(buildProductSearchHref('')).toBe('/products');
  });
});
