import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mangosteen/database';

@Controller('affiliates')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  @Post('clicks')
  async trackClick(@Body() body: any, @Req() request: Request) {
    const ip = request.ip || request.socket.remoteAddress || 'unknown_ip';
    const userAgent = request.headers['user-agent'] || 'unknown_ua';
    return this.affiliateService.trackClick(body, ip, userAgent);
  }

  @Get('me')
  @Roles(UserRole.AFFILIATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAffiliateMe(@Req() request: any) {
    return this.affiliateService.getAffiliateMe(request.user.sub);
  }

  @Post('withdrawals')
  @Roles(UserRole.AFFILIATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createWithdrawal(@Req() request: any, @Body() body: any) {
    return this.affiliateService.createWithdrawal(request.user.sub, body);
  }

  // Admin Payout Reviews Queue
  @Get('admin/withdrawals')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAdminWithdrawals() {
    return this.affiliateService.getAdminWithdrawals();
  }

  @Patch('admin/withdrawals/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateWithdrawalStatus(@Param('id') id: string, @Body() body: any) {
    return this.affiliateService.updateWithdrawalStatus(id, body);
  }
}
