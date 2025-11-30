import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { HomepageProduct, ProductDetailData } from '@/types/product';

const homepageProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  images: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, alt: true, sortOrder: true },
    take: 3,
  },
  inventory: {
    select: { quantity: true, reservedQuantity: true, lowStockThreshold: true },
  },
  reviews: {
    select: { rating: true },
    take: 10,
  },
});

const productDetailInclude = Prisma.validator<Prisma.ProductInclude>()({
  category: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, alt: true, sortOrder: true },
  },
  inventory: {
    select: { quantity: true, reservedQuantity: true, lowStockThreshold: true },
  },
  reviews: {
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  },
  _count: {
    select: { reviews: true },
  },
});

type RawHomepageProduct = Prisma.ProductGetPayload<{
  include: typeof homepageProductInclude;
}>;

type RawProductDetail = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

export interface ProductListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductListResult {
  products: HomepageProduct[];
  pagination: ProductListPagination;
  appliedFilters: {
    search?: string;
    category?: string;
    sortBy?: ProductListQuery['sortBy'];
    sortOrder?: ProductListQuery['sortOrder'];
  };
}

function mapHomepageProduct(product: RawHomepageProduct): HomepageProduct {
  const availableQuantity = product.inventory
    ? Math.max(0, product.inventory.quantity - product.inventory.reservedQuantity)
    : 0;

  const inStock = product.inventory
    ? availableQuantity > 0
    : product.allowOutOfStock;

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length
      : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    originalPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    currency: product.currency,
    shortDesc: product.shortDesc,
    image: product.images[0]?.url,
    images: product.images,
    rating: Number(averageRating.toFixed(1)),
    reviews: product.reviews.length,
    inStock,
    availableQuantity,
    allowOutOfStock: product.allowOutOfStock,
    tags: product.tags,
    originCountry: product.originCountry ?? undefined,
    hsCode: product.hsCode ?? undefined,
    materials: product.materials ?? [],
    netWeight: product.netWeight ? Number(product.netWeight) : undefined,
    volumetricWeight: product.volumetricWeight ? Number(product.volumetricWeight) : undefined,
  };
}

export async function getHomepageProducts(limit = 10): Promise<HomepageProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    include: homepageProductInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return products.map(mapHomepageProduct);
}

export async function getDiscountedProducts(limit = 20): Promise<HomepageProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      comparePrice: {
        not: null,
      },
    },
    include: homepageProductInclude,
    orderBy: [
      { updatedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit * 2,
  });

  const discounted = products
    .filter((product) => {
      if (!product.comparePrice) return false;
      try {
        const compareValue = Number(product.comparePrice);
        const saleValue = Number(product.price);
        return compareValue > saleValue;
      } catch {
        return false;
      }
    })
    .slice(0, limit);

  return discounted.map(mapHomepageProduct);
}

function mapProductDetail(product: RawProductDetail): ProductDetailData {
  const availableQuantity = product.inventory
    ? Math.max(0, product.inventory.quantity - product.inventory.reservedQuantity)
    : 0;
  const lowStockThreshold = product.inventory?.lowStockThreshold ?? 10;
  const inStock = product.allowOutOfStock || availableQuantity > 0;
  const isLowStock = !product.allowOutOfStock && availableQuantity > 0 && availableQuantity <= lowStockThreshold;
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    shortDesc: product.shortDesc ?? null,
    sku: product.sku,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    currency: product.currency,
    tags: product.tags,
    originCountry: product.originCountry ?? null,
    hsCode: product.hsCode ?? null,
    materials: product.materials ?? [],
    netWeight: product.netWeight ? Number(product.netWeight) : null,
    volumetricWeight: product.volumetricWeight ? Number(product.volumetricWeight) : null,
    packageDimensions: product.packageDimensions ?? null,
    compliance: product.compliance ?? null,
    category: product.category,
    images: product.images,
    inventory: product.inventory
      ? {
          quantity: product.inventory.quantity,
          reservedQuantity: product.inventory.reservedQuantity,
          lowStockThreshold,
        }
      : null,
    availableQuantity,
    allowOutOfStock: product.allowOutOfStock,
    inStock,
    isLowStock,
    averageRating: Number(averageRating.toFixed(1)),
    reviewCount: product._count.reviews,
    reviews: product.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title ?? null,
      content: review.content ?? null,
      user: {
        id: review.user?.id ?? 'anonymous',
        name: review.user?.name ?? 'Anonymous',
        avatar: review.user?.avatar ?? null,
      },
      createdAt: review.createdAt.toISOString(),
    })),
  };
}

export async function getProductDetail(productId: string): Promise<ProductDetailData | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productDetailInclude,
  });
  return product ? mapProductDetail(product) : null;
}

export async function getRelatedProducts(options: {
  categoryId: string;
  excludeProductId: string;
  limit: number;
}): Promise<HomepageProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      categoryId: options.categoryId,
      NOT: { id: options.excludeProductId },
    },
    include: homepageProductInclude,
    orderBy: { createdAt: 'desc' },
    take: options.limit,
  });

  return products.map(mapHomepageProduct);
}

async function resolveCategoryIds(categoryIdentifier: string) {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id: categoryIdentifier }, { slug: categoryIdentifier }],
    },
    select: { id: true },
  });

  if (!category) {
    return [];
  }

  const ids: string[] = [category.id];
  let currentLevel = [category.id];

  while (currentLevel.length > 0) {
    const children = await prisma.category.findMany({
      where: { parentId: { in: currentLevel } },
      select: { id: true },
    });
    if (children.length === 0) {
      break;
    }
    const childIds = children.map((child) => child.id);
    ids.push(...childIds);
    currentLevel = childIds;
  }

  return ids;
}

export async function getProductList(query: ProductListQuery): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(100, query.limit ?? 10));
  const skip = (page - 1) * limit;

  const filters: Prisma.ProductWhereInput[] = [{ status: 'PUBLISHED' }];

  if (query.search) {
    filters.push({
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ],
    });
  }

  if (query.category && query.category !== 'all') {
    const categoryIds = await resolveCategoryIds(query.category);
    if (categoryIds.length > 0) {
      filters.push({ categoryId: { in: categoryIds } });
    }
  }

  const where: Prisma.ProductWhereInput = {
    AND: filters,
  };

  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? (sortBy === 'createdAt' ? 'desc' : 'asc');
  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: homepageProductInclude,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const pagination: ProductListPagination = {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };

  return {
    products: products.map(mapHomepageProduct),
    pagination,
    appliedFilters: {
      search: query.search,
      category: query.category,
      sortBy,
      sortOrder,
    },
  };
}




