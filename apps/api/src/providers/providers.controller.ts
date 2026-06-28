import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { VerificationService } from './verification.service';
import { WalletService } from './wallet.service';
import { MediaUploader } from './media/media-uploader';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import {
  AddPhotoDto,
  AddVerificationDto,
  AvailabilityDto,
  BecomeProviderDto,
  ServiceAreaDto,
  SetCategoriesDto,
  VerificationDecisionDto,
  WalletTopupDto,
} from './dto/provider.dto';

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providers: ProvidersService,
    private readonly uploader: MediaUploader,
    private readonly wallet: WalletService,
  ) {}

  /** Req 4.5: provider wallet balance + ledger. */
  @Get('me/wallet')
  @UseGuards(JwtAuthGuard)
  walletSummary(@CurrentUser() u: RequestUser) {
    return this.wallet.summary(u.userId);
  }

  /** Req 4.3: provider tops up their wallet (mock top-up). */
  @Post('me/wallet/topup')
  @UseGuards(JwtAuthGuard)
  walletTopup(@CurrentUser() u: RequestUser, @Body() dto: WalletTopupDto) {
    return this.wallet.topup(u.userId, dto.amountCents);
  }

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

  /** Spec 12: provider work-photos portfolio. */
  @Get('me/photos')
  @UseGuards(JwtAuthGuard)
  listPhotos(@CurrentUser() u: RequestUser) {
    return this.providers.listPhotos(u.userId);
  }

  @Post('me/photos')
  @UseGuards(JwtAuthGuard)
  addPhoto(@CurrentUser() u: RequestUser, @Body() dto: AddPhotoDto) {
    return this.providers.addPhoto(u.userId, dto);
  }

  @Delete('me/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  removePhoto(@CurrentUser() u: RequestUser, @Param('photoId') photoId: string) {
    return this.providers.removePhoto(u.userId, photoId);
  }

  /** Public profile (verified flag + work photos). No auth required. */
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
