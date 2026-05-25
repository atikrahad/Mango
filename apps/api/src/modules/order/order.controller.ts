import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mangosteen/database';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMyOrders(@Req() request: any) {
    return this.orderService.getMyOrders(request.user.sub);
  }

  @Post('checkout')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async checkout(@Req() request: any, @Body() body: any) {
    return this.orderService.checkout(request.user.sub, body);
  }

  // Admin Dashboard Actions
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAdminOrders() {
    return this.orderService.getAdminOrders();
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.orderService.updateOrderStatus(id, body);
  }

  @Get('riders')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getDeliveryRiders() {
    return this.orderService.getDeliveryRiders();
  }
}
