import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mangosteen/database';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('products')
  async getProducts(@Query() query: any) {
    return this.catalogService.getProducts(query);
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createProduct(@Body() body: any) {
    return this.catalogService.createProduct(body);
  }

  @Post('variants')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createVariant(@Body() body: any) {
    return this.catalogService.createVariant(body);
  }
}
