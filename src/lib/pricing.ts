/**
 * 订单基础计价工具
 * 统一维护运费、税费等计算逻辑，避免前后端重复写死
 */

export const SHIPPING_FREE_THRESHOLD = 99;
export const SHIPPING_FLAT_RATE = 9.99;
export const TAX_RATE = 0.08; // 8%
export const DUTY_RATE_DEFAULT = 0.05;

export type ShippingZonePricing = {
  baseFee?: number;
  perKgFee?: number;
  freeShippingThreshold?: number;
  fuelSurcharge?: number;
  maxWeight?: number;
};

export type ShippingCalcOptions = {
  zone?: ShippingZonePricing | null;
  totalWeightKg?: number;
  fuelSurcharge?: number;
};

export type DutyCalcOptions = {
  rate?: number;
  minDeclaredValue?: number;
};

export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function calculateShippingAmount(
  subtotal: number,
  options?: ShippingCalcOptions,
) {
  if (!options?.zone) {
    return subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }

  const threshold = options.zone.freeShippingThreshold ?? SHIPPING_FREE_THRESHOLD;
  if (threshold > 0 && subtotal >= threshold) {
    return 0;
  }

  const baseFee = options.zone.baseFee ?? SHIPPING_FLAT_RATE;
  const perKgFee = options.zone.perKgFee ?? 0;
  const totalWeight = Math.max(options.totalWeightKg ?? 1, 0);
  const fuelSurcharge = options.zone.fuelSurcharge ?? options.fuelSurcharge ?? 0;

  const amount = baseFee + perKgFee * totalWeight + fuelSurcharge;
  return roundCurrency(amount);
}

export function calculateTaxAmount(subtotal: number, rate: number = TAX_RATE) {
  if (rate <= 0) {
    return 0;
  }
  return roundCurrency(subtotal * rate);
}

export function calculateDutyAmount(
  declaredValue: number,
  options: DutyCalcOptions = {},
) {
  const rate = options.rate ?? DUTY_RATE_DEFAULT;
  if (rate <= 0) {
    return 0;
  }

  if (options.minDeclaredValue && declaredValue <= options.minDeclaredValue) {
    return 0;
  }

  return roundCurrency(declaredValue * rate);
}

export function calculateInsuranceAmount(declaredValue: number, rate = 0.01) {
  if (!declaredValue || rate <= 0) {
    return 0;
  }

  return roundCurrency(declaredValue * rate);
}
