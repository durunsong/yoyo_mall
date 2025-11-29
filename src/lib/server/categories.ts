import 'server-only';

import { prisma } from '@/lib/prisma';
import type { CategorySummary } from '@/types/category';

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

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: category._count.products,
  }));
}


