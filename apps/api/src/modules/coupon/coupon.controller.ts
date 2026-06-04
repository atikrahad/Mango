import { Controller, Get, Query } from '@nestjs/common';
import { CouponService } from './coupon.service';

@Controller('coupons')
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Get('validate')
  async validateCoupon(
    @Query('code') code: string,
    @Query('cartValue') cartValue: string,
  ) {
    const value = parseFloat(cartValue) || 0;
    return this.couponService.validateCoupon(code, value);
  }
}
