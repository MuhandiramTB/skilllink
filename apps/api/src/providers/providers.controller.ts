import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { VerificationService } from './verification.service';
import { MediaUploader } from './media/media-uploader';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import {
  AddVerificationDto,
  AvailabilityDto,
  BecomeProviderDto,
  ServiceAreaDto,
  SetCategoriesDto,
  VerificationDecisionDto,
} from './dto/provider.dto';

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providers: ProvidersService,
    private readonly uploader: MediaUploader,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  become(@CurrentUser() u: RequestUser, @Body() dto: BecomeProviderDto) {
    return this.providers.become(u.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() u: RequestUser) {
    return this.providers.meSummary(u.userId);
  }

  /** Presign a media upload (mock returns a fake URL). */
  @Post('me/uploads/:kind')
  @UseGuards(JwtAuthGuard)
  presign(@CurrentUser() u: RequestUser, @Param('kind') kind: string) {
    return this.uploader.presign(kind, u.userId);
  }

  @Post('me/verifications')
  @UseGuards(JwtAuthGuard)
  addVerification(@CurrentUser() u: RequestUser, @Body() dto: AddVerificationDto) {
    return this.providers.addVerification(u.userId, dto);
  }

  @Put('me/service-area')
  @UseGuards(JwtAuthGuard)
  setArea(@CurrentUser() u: RequestUser, @Body() dto: ServiceAreaDto) {
    return this.providers.setServiceArea(u.userId, dto);
  }

  @Put('me/categories')
  @UseGuards(JwtAuthGuard)
  setCategories(@CurrentUser() u: RequestUser, @Body() dto: SetCategoriesDto) {
    return this.providers.setCategories(u.userId, dto.categoryIds);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  availability(@CurrentUser() u: RequestUser, @Body() dto: AvailabilityDto) {
    return this.providers.setAvailability(u.userId, dto.isAvailable);
  }

  @Patch('me/details')
  @UseGuards(JwtAuthGuard)
  details(
    @CurrentUser() u: RequestUser,
    @Body() dto: { yearsExperience?: number; workingDays?: string; workingHours?: string; emergencyService?: boolean },
  ) {
    return this.providers.setDetails(u.userId, dto);
  }

  /** Public profile (verified flag). No auth required. */
  @Get(':id')
  publicProfile(@Param('id') id: string) {
    return this.providers.publicProfile(id);
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminVerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get('verifications')
  queue(@Query('status') _status?: string) {
    return this.verification.queue();
  }

  @Patch('providers/:id/verification')
  decide(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: VerificationDecisionDto,
  ) {
    return this.verification.decide(admin.userId, id, dto.decision, dto.reason);
  }
}
