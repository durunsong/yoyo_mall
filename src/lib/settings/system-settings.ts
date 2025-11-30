import {
  normalizeProductDetailConfig,
  defaultProductDetailConfig,
} from '@/lib/config/product-detail';

type MeasurementSystem = 'METRIC' | 'IMPERIAL';

export interface SystemSettings {
  siteName: string;
  siteDescription: string | null;
  siteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultCountry: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  autoCurrencySwitch: boolean;
  autoLanguageSwitch: boolean;
  defaultMeasurement: MeasurementSystem;
  customsRequireNationalId: boolean;
  dutyPrepaid: boolean;
  allowPreorder: boolean;
  preferredLogistics: Record<string, unknown> | null;
  returnPolicyDays: number;
  defaultWarehouseCountry: string | null;
  allowedPaymentCountries: string[];
  stripeEnabled: boolean;
  alipayEnabled: boolean;
  wechatPayEnabled: boolean;
  productDetailConfig: ReturnType<typeof normalizeProductDetailConfig>;
}

export const defaultSystemSettings: SystemSettings = {
  siteName: 'Yobuy',
  siteDescription: '您的跨境电商平台',
  siteUrl: 'https://yoyomall.com',
  contactEmail: 'support@yoyomall.com',
  contactPhone: '+86 400-123-4567',
  defaultLanguage: 'en-US',
  defaultCurrency: 'CNY',
  defaultCountry: 'CN',
  supportedCountries: ['CN', 'US', 'DE', 'AU'],
  supportedCurrencies: ['CNY', 'USD', 'EUR', 'GBP'],
  autoCurrencySwitch: true,
  autoLanguageSwitch: true,
  defaultMeasurement: 'METRIC',
  customsRequireNationalId: false,
  dutyPrepaid: false,
  allowPreorder: false,
  preferredLogistics: null,
  returnPolicyDays: 30,
  defaultWarehouseCountry: null,
  allowedPaymentCountries: [],
  stripeEnabled: false,
  alipayEnabled: false,
  wechatPayEnabled: false,
  productDetailConfig: normalizeProductDetailConfig(defaultProductDetailConfig),
};

type SystemSettingsInput = Partial<Omit<SystemSettings, 'productDetailConfig'>> & {
  productDetailConfig?: unknown;
};

export function mergeSystemSettings(input?: SystemSettingsInput): SystemSettings {
  if (!input) {
    return defaultSystemSettings;
  }

  return {
    ...defaultSystemSettings,
    ...input,
    productDetailConfig: normalizeProductDetailConfig(
      input.productDetailConfig ?? defaultProductDetailConfig,
    ),
  };
}

