import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { CategoriesModule } from './categories/categories.module';
import { MatchingModule } from './matching/matching.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ProvidersModule } from './providers/providers.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RewardsModule } from './rewards/rewards.module';
import { AdminOpsModule } from './admin-ops/admin-ops.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavouritesModule } from './favourites/favourites.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SettingsModule } from './settings/settings.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limit: 120 req / minute / IP (defense-in-depth; OTP has a stricter guard).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    AdminModule,
    ProvidersModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    RewardsModule,
    AdminOpsModule,
    NotificationsModule,
    CategoriesModule,
    MatchingModule,
    FavouritesModule,
    ReferralsModule,
    SettingsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [HealthController],
})
export class AppModule {}
