/**
 * 优惠券校验与折扣计算工具
 * 供多个 API/前端调用，保证逻辑一致
 */

import prisma from '@/lib/prisma';
import { calculateShippingAmount, roundCurrency } from '@/lib/pricing';

export type CouponErrorCode =
  | 'INVALID_COUPON'
  | 'COUPON_LIMIT_REACHED'
  | 'COUPON_MIN_AMOUNT';

export class CouponError extends Error {
  constructor(public code: CouponErrorCode, message: string) {
    super(message);
    this.name = 'CouponError';
  }
}

interface CouponValidationOptions {
  code: string;
  subtotal: number;
  shippingAmount?: number;
}

export async function validateCouponAndCalculateDiscount({
  code,
  subtotal,
  shippingAmount = calculateShippingAmount(subtotal),
}: CouponValidationOptions) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    throw new CouponError('INVALID_COUPON', '优惠券码不能为空');
  }

  const now = new Date();
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: normalizedCode,
      isActive: true,
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
      ],
    },
  });

  if (!coupon) {
    throw new CouponError('INVALID_COUPON', '优惠券无效或已过期');
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    throw new CouponError('COUPON_LIMIT_REACHED', '优惠券已达使用上限');
  }

  if (
    coupon.minimumAmount &&
    subtotal < Number(coupon.minimumAmount)
  ) {
    throw new CouponError(
      'COUPON_MIN_AMOUNT',
      `订单金额需满 ${Number(coupon.minimumAmount).toFixed(2)} 才可使用该优惠券`,
    );
  }

  const value = Number(coupon.value);
  let discountAmount = 0;

  switch (coupon.type) {
    case 'PERCENTAGE':
      discountAmount = roundCurrency((subtotal * value) / 100);
      break;
    case 'FIXED_AMOUNT':
      discountAmount = Math.min(value, subtotal);
      break;
    case 'FREE_SHIPPING':
      discountAmount = shippingAmount;
      break;
    default:
      discountAmount = 0;
  }

  return {
    coupon,
    discountAmount: roundCurrency(discountAmount),
    shippingAmount,
  };
}

