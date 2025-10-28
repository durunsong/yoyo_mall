/**
 * 动态生成 Sitemap
 * 帮助搜索引擎索引网站内容
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoyomall.com';

  // 获取所有已发布的商品
  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // 获取所有分类
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // 静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ];

  // 商品页面
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 分类页面
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/products?category=${category.id}`,
    lastModified: category.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}

