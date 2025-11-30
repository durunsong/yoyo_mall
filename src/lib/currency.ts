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

export function normalizeCurrency(input?: string) {
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

type CurrencyConversionOptions = {
  precision?: number;
  fallback?: number;
};

export function convertCurrency(
  value: number,
  rate?: number | null,
  options: CurrencyConversionOptions = {},
) {
  if (!rate || Number.isNaN(rate)) {
    return options.fallback ?? value;
  }

  const precision = options.precision ?? 2;
  const converted = value * rate;
  return Number(converted.toFixed(precision));
}

