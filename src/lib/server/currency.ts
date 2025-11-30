import 'server-only';

import { prisma } from '@/lib/prisma';
import { convertCurrency, normalizeCurrency } from '@/lib/currency';

type CurrencyRateResult = {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
};

export async function getCurrencyRate(
  baseCurrency: string,
  targetCurrency: string,
): Promise<CurrencyRateResult | null> {
  const base = normalizeCurrency(baseCurrency);
  const target = normalizeCurrency(targetCurrency);

  if (base === target) {
    return { baseCurrency: base, targetCurrency: target, rate: 1 };
  }

  const record = await prisma.currencyRate.findUnique({
    where: {
      baseCurrency_targetCurrency: {
        baseCurrency: base,
        targetCurrency: target,
      },
    },
  });

  if (record) {
    return {
      baseCurrency: base,
      targetCurrency: target,
      rate: Number(record.rate),
    };
  }

  // 如果正向汇率不存在，尝试查找反向汇率
  const reverseRecord = await prisma.currencyRate.findUnique({
    where: {
      baseCurrency_targetCurrency: {
        baseCurrency: target,
        targetCurrency: base,
      },
    },
  });

  if (reverseRecord) {
    return {
      baseCurrency: base,
      targetCurrency: target,
      rate: 1 / Number(reverseRecord.rate),
    };
  }

  return null;
}

export async function convertCurrencyAmount(
  value: number,
  baseCurrency: string,
  targetCurrency: string,
) {
  if (baseCurrency === targetCurrency) {
    return value;
  }

  const rate = await getCurrencyRate(baseCurrency, targetCurrency);
  if (!rate) {
    return value;
  }

  return convertCurrency(value, rate.rate);
}


