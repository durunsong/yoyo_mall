/**
 * 订单基础计价工具
 * 统一维护运费、税费等计算逻辑，避免前后端重复写死
 */

export const SHIPPING_FREE_THRESHOLD = 99;
export const SHIPPING_FLAT_RATE = 9.99;
export const TAX_RATE = 0.08; // 8%

export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function calculateShippingAmount(subtotal: number) {
  return subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

export function calculateTaxAmount(subtotal: number) {
  return roundCurrency(subtotal * TAX_RATE);
}

