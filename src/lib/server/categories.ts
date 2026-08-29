import 'server-only';

import { prisma } from '@/lib/prisma';
import type { CategorySummary } from '@/types/category';

function mapCategory(category: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count: { products: number };
}): CategorySummary {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    productCount: category._count.products,
  };
}

export async function getTopCategories(limit = 8): Promise<CategorySummary[]> {
  try {
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
        { sortOrder: 'asc' },
      ],
      take: limit,
    });

    return categories.map(mapCategory);
  } catch (error) {
    console.warn('[catalog] Falling back to an empty top category list:', error);
    return [];
  }
}

export async function getActiveCategories(): Promise<CategorySummary[]> {
  try {
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
  } catch (error) {
    console.warn('[catalog] Falling back to an empty category list:', error);
    return [];
  }
}
