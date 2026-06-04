import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mangosteen/database';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post('checkout')
  async checkout(@Body() body: any) {
    return this.orderService.checkout(body);
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

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }
}
