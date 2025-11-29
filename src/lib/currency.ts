const currencySymbolMap: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
  HKD: 'HK$',
  TWD: 'NT$',
  AUD: 'A$',
  CAD: 'C$',
};

function normalizeCurrency(input?: string) {
  return (input || 'USD').toUpperCase();
}

export function getCurrencySymbol(currency?: string): string {
  const normalized = normalizeCurrency(currency);
  return currencySymbolMap[normalized] || normalized;
}

export function formatCurrency(
  value: number,
  currency?: string,
  options: Intl.NumberFormatOptions = {},
) {
  const normalized = normalizeCurrency(currency);
  const formatter = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: normalized,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  return formatter.format(value);
}


