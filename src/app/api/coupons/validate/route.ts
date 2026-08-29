import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  CouponError,
  validateCouponAndCalculateDiscount,
} from '@/lib/coupon';
import { calculateShippingAmount, roundCurrency } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const code: string = body.code || body.couponCode || '';

    if (!code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_COUPON', message: '请输入优惠券码' },
        { status: 400 },
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'EMPTY_CART', message: '购物车为空，无法使用优惠券' },
        { status: 400 },
      );
    }

    const subtotal = roundCurrency(
      cartItems.reduce((total, item) => {
        const price = Number(item.variant?.price ?? item.product.price);
        return total + price * item.quantity;
      }, 0),
    );

    const shippingAmount = calculateShippingAmount(subtotal);

    const { coupon, discountAmount } =
      await validateCouponAndCalculateDiscount({
        code,
        subtotal,
        shippingAmount,
      });

    return NextResponse.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: Number(coupon.value),
          minimumAmount: coupon.minimumAmount
            ? Number(coupon.minimumAmount)
            : null,
        },
        discountAmount,
        subtotal,
        shippingAmount,
      },
    });
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: 400 },
      );
    }

    console.error('验证优惠券失败:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 },
    );
  }
}

