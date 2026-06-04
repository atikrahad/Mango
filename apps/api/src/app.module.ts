import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { OrderModule } from './modules/order/order.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { CouponModule } from './modules/coupon/coupon.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // global rate limit: max 100 requests per 1 min
    }]),
    PrismaModule,
    AuthModule,
    CatalogModule,
    AffiliateModule,
    OrderModule,
    LogisticsModule,
    CouponModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
