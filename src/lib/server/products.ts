import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type HomepageProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  currency: string;
  shortDesc?: string | null;
  image?: string;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
  }>;
  rating: number;
  reviews: number;
  inStock: boolean;
  availableQuantity: number;
  allowOutOfStock: boolean;
  tags: string[];
};

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

type RawHomepageProduct = Prisma.ProductGetPayload<{
  include: typeof homepageProductInclude;
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


