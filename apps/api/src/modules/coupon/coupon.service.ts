import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async validateCoupon(code: string, cartValue: number) {
    if (!code) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Coupon code must be specified.',
        },
      });
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code,
        isActive: true,
        expiryDate: { gt: new Date() },
      },
    });

    if (!coupon || coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Promo coupon code is invalid, expired, or fully utilized.',
        },
      });
    }

    if (cartValue < Number(coupon.minCartValue)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: `Minimum cart value of ${coupon.minCartValue} BDT required to use coupon.`,
        },
      });
    }

    return {
      success: true,
      data: coupon,
    };
  }
}
