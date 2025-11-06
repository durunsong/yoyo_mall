/**
 * SEO 元数据组件
 * 用于设置页面的 SEO 信息
 */

import { Metadata } from 'next';

interface SEOMetadataProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

/**
 * 生成页面元数据
 */
export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  ogImage = '/images/og-default.jpg',
  canonicalUrl,
  noindex = false,
}: SEOMetadataProps): Metadata {
  const siteName = 'YOYO Mall';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoyomall.com';
  
  const fullTitle = title.includes(siteName) ? title : `${title} - ${siteName}`;
  const url = canonicalUrl || baseUrl;
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'zh_CN',
      type: 'website',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@yoyomall',
    },

    // Robots
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical URL
    alternates: {
      canonical: url,
      languages: {
        'zh-CN': `${url}?lang=zh-CN`,
        'en-US': `${url}?lang=en-US`,
      },
    },

    // Verification
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },

    // 其他元数据
    applicationName: siteName,
    authors: [{ name: 'YOYO Mall Team' }],
    generator: 'Next.js',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

/**
 * 商品 SEO 元数据
 */
export function generateProductSEO(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  sku?: string;
}): Metadata {
  const siteName = 'YOYO Mall';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoyomall.com';

  const title = `${product.name} - ${siteName}`;
  const description = product.description || `购买 ${product.name}，价格：${product.currency} ${product.price}`;
  
  const keywords = [
    product.name,
    product.category || '',
    '在线购物',
    '跨境电商',
  ].filter(Boolean);

  return {
    ...generateSEOMetadata({
      title,
      description,
      keywords,
      ogImage: product.images[0],
    }),
    
    // 商品特定的结构化数据
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': product.currency,
      'product:condition': 'new',
      'product:availability': 'in stock',
    },
  };
}

/**
 * 文章/博客 SEO 元数据
 */
export function generateArticleSEO(article: {
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
  coverImage?: string;
}): Metadata {
  const baseMetadata = generateSEOMetadata({
    title: article.title,
    description: article.description,
    keywords: article.tags,
    ogImage: article.coverImage,
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'article',
      publishedTime: article.publishedTime,
      modifiedTime: article.modifiedTime,
      authors: [article.author],
      tags: article.tags,
    },
  };
}

/**
 * 默认 SEO 配置
 */
export const defaultSEOConfig = {
  title: 'YOYO Mall - 跨境电商独立站',
  description: '专业的跨境电商平台，提供优质商品和完善的购物体验。支持多语言、多币种、多种支付方式。',
  keywords: [
    '跨境电商',
    '在线购物',
    '独立站',
    '电商平台',
    '国际购物',
    'YOYO Mall',
  ],
};




