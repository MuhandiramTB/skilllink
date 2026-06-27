import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [AuthModule, RewardsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtAuthGuard],
})
export class ReviewsModule {}
