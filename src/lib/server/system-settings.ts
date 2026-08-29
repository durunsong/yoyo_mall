import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  SystemSettings,
  defaultSystemSettings,
  mergeSystemSettings,
} from '@/lib/settings/system-settings';

export async function getSystemSettings(): Promise<SystemSettings> {
  let record;

  try {
    record = await prisma.systemSettings.findUnique({
      where: { id: 'global' },
    });
  } catch (error) {
    console.warn('[settings] Falling back to defaults:', error);
    return defaultSystemSettings;
  }

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
    preferredLogistics:
      record.preferredLogistics &&
      typeof record.preferredLogistics === 'object' &&
      !Array.isArray(record.preferredLogistics)
        ? (record.preferredLogistics as Record<string, unknown>)
        : null,
    returnPolicyDays: record.returnPolicyDays ?? defaultSystemSettings.returnPolicyDays,
    defaultWarehouseCountry: record.defaultWarehouseCountry,
    allowedPaymentCountries: record.allowedPaymentCountries,
    stripeEnabled: record.stripeEnabled,
    // 这两个渠道尚未接入完整链路，历史配置也不能让前台误显示为可用。
    alipayEnabled: false,
    wechatPayEnabled: false,
    productDetailConfig: record.productDetailConfig,
  });
}
