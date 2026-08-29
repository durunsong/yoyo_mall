import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/products/product-detail-client';
import { getProductDetail, getRelatedProducts } from '@/lib/server/products';
import { getSystemSettings } from '@/lib/server/system-settings';
import { getDictionaries } from '@/lib/server/translations';
import { auth } from '@/lib/auth';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) {
    notFound();
  }

  const [settings, session] = await Promise.all([getSystemSettings(), auth()]);
  const locale = settings.defaultLanguage || 'en-US';
  const translations = await getDictionaries(locale, ['product', 'common']);

  const relatedProducts =
    settings.productDetailConfig.recommendations.enabled && product.category
      ? await getRelatedProducts({
          categoryId: product.category.id,
          excludeProductId: product.id,
          limit: settings.productDetailConfig.recommendations.limit,
        })
      : [];

  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host =
    headersList.get('host') ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_HOST ??
    'localhost:3000';
  const shareUrl = `${protocol}://${host}/products/${product.id}`;

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      settings={settings}
      translations={{
        product: translations.product,
        common: translations.common,
      }}
      shareUrl={shareUrl}
      sessionUser={session?.user ?? null}
    />
  );
}
