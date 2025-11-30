import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  SystemSettings,
  defaultSystemSettings,
  mergeSystemSettings,
} from '@/lib/settings/system-settings';

export async function getSystemSettings(): Promise<SystemSettings> {
  const record = await prisma.systemSettings.findUnique({
    where: { id: 'global' },
  });

  if (!record) {
    return defaultSystemSettings;
  }

  return mergeSystemSettings({
    siteName: record.siteName,
    siteDescription: record.siteDescription,
    siteUrl: record.siteUrl,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    defaultLanguage: record.defaultLanguage,
    defaultCurrency: record.defaultCurrency,
    defaultCountry: record.defaultCountry,
    supportedCountries: record.supportedCountries,
    supportedCurrencies: record.supportedCurrencies,
    autoCurrencySwitch: record.autoCurrencySwitch,
    autoLanguageSwitch: record.autoLanguageSwitch,
    defaultMeasurement: record.defaultMeasurement,
    customsRequireNationalId: record.customsRequireNationalId,
    dutyPrepaid: record.dutyPrepaid,
    allowPreorder: record.allowPreorder,
    preferredLogistics: record.preferredLogistics,
    returnPolicyDays: record.returnPolicyDays ?? defaultSystemSettings.returnPolicyDays,
    defaultWarehouseCountry: record.defaultWarehouseCountry,
    allowedPaymentCountries: record.allowedPaymentCountries,
    stripeEnabled: record.stripeEnabled,
    alipayEnabled: record.alipayEnabled,
    wechatPayEnabled: record.wechatPayEnabled,
    productDetailConfig: record.productDetailConfig,
  });
}


