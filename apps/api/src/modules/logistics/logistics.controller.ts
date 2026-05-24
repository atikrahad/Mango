import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mangosteen/database';

@Controller('logistics')
export class LogisticsController {
  constructor(private logisticsService: LogisticsService) {}

  @Get('runs')
  @Roles(UserRole.DELIVERY_AGENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAssignedRuns(@Req() request: any) {
    return this.logisticsService.getAssignedRuns(request.user.sub);
  }

  @Post('orders/:orderId/arrive')
  @Roles(UserRole.DELIVERY_AGENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async triggerOtpArrival(@Param('orderId') orderId: string, @Req() request: any) {
    return this.logisticsService.triggerOtpArrival(orderId, request.user.sub);
  }

  @Post('orders/:orderId/verify-otp')
  @Roles(UserRole.DELIVERY_AGENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async verifyOtp(@Param('orderId') orderId: string, @Req() request: any, @Body() body: any) {
    return this.logisticsService.verifyOtp(orderId, request.user.sub, body);
  }
}
