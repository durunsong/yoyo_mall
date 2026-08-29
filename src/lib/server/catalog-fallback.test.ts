jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getHomepageProducts, getProductList } from '@/lib/server/products';
import { getActiveCategories, getTopCategories } from '@/lib/server/categories';

describe('catalog reads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an empty homepage when product storage is unavailable', async () => {
    jest.mocked(prisma.product.findMany).mockRejectedValueOnce(new Error('DATABASE_URL is missing'));

    await expect(getHomepageProducts()).resolves.toEqual([]);
  });

  it('returns an empty catalog page when product storage is unavailable', async () => {
    jest.mocked(prisma.product.findMany).mockRejectedValueOnce(new Error('DATABASE_URL is missing'));
    jest.mocked(prisma.product.count).mockRejectedValueOnce(new Error('DATABASE_URL is missing'));

    await expect(getProductList({})).resolves.toMatchObject({
      products: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
    });
  });

  it('returns empty category collections when category storage is unavailable', async () => {
    jest.mocked(prisma.category.findMany).mockRejectedValue(new Error('DATABASE_URL is missing'));

    await expect(getTopCategories()).resolves.toEqual([]);
    await expect(getActiveCategories()).resolves.toEqual([]);
  });
});
