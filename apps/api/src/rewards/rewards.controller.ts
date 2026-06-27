import { Controller, Get, UseGuards } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  /** Req 6.3: customer points balance + ledger. */
  @Get('me')
  me(@CurrentUser() u: RequestUser) {
    return this.rewards.balance(u.userId);
  }
}
