import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RewardsController],
  providers: [RewardsService, JwtAuthGuard],
  exports: [RewardsService],
})
export class RewardsModule {}
