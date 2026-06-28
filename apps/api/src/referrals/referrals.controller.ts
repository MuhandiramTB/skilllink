import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

class ApplyReferralDto {
  @IsString() @MinLength(4) code!: string;
}

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('me')
  me(@CurrentUser() u: RequestUser) {
    return this.referrals.me(u.userId);
  }

  @Post('apply')
  apply(@CurrentUser() u: RequestUser, @Body() dto: ApplyReferralDto) {
    return this.referrals.apply(u.userId, dto.code);
  }
}
