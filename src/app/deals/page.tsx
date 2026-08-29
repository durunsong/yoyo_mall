import { DealsPageClient } from '@/components/products/deals-page-client';
import { getDiscountedProducts } from '@/lib/server/products';
import { getSystemSettings } from '@/lib/server/system-settings';
import { getDictionaries } from '@/lib/server/translations';
import { getCurrencySymbol } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  const [settings, products] = await Promise.all([
    getSystemSettings(),
    getDiscountedProducts(20),
  ]);
  const locale = settings.defaultLanguage || 'en-US';
  const dictionaries = await getDictionaries(locale, ['common', 'product']);

  return (
    <DealsPageClient
      initialProducts={products}
      translations={{
        common: dictionaries.common,
        product: dictionaries.product,
      }}
      currencySymbol={getCurrencySymbol(settings.defaultCurrency)}
    />
  );
}

