import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycSubmitDto } from './dto/kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  /** Provider submits NIC front/back + guided liveness selfie for verification. */
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  submit(@CurrentUser() u: RequestUser, @Body() dto: KycSubmitDto) {
    return this.kyc.submit(u.userId, {
      providerId: u.userId,
      fullName: dto.fullName ?? null,
      documentNumber: dto.documentNumber ?? null,
      nicFrontUrl: dto.nicFrontUrl,
      nicBackUrl: dto.nicBackUrl,
      selfieUrl: dto.selfieUrl,
      livenessChallenges: dto.livenessChallenges,
    });
  }

  /** Latest KYC status for the current provider (wizard resume / dashboard badge). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() u: RequestUser) {
    return this.kyc.status(u.userId);
  }

  /**
   * Async vendor callback (Onfido/Persona). Public — the vendor is not a logged-in
   * user. Production must verify the vendor's signature header before trusting this;
   * the mock vendor is synchronous and never calls it.
   */
  @Post('webhook/:vendor')
  webhook(@Param('vendor') vendor: string, @Body() payload: unknown) {
    return this.kyc.handleWebhook(vendor, payload);
  }
}
