import 'server-only';

import { prisma } from '@/lib/prisma';
import type { CategorySummary } from '@/types/category';

function mapCategory(category: { id: string; name: string; slug: string; _count: { products: number } }): CategorySummary {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: category._count.products,
  };
}

export async function getTopCategories(limit = 8): Promise<CategorySummary[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: [
      {
        products: {
          _count: 'desc',
        },
      },
      {
        sortOrder: 'asc',
      },
    ],
    take: limit,
  });

  return categories.map(mapCategory);
}

export async function getActiveCategories(): Promise<CategorySummary[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return categories.map(mapCategory);
}



