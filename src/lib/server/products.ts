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



