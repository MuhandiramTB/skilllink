import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  BecomeProviderDto,
  LogoutDto,
  RefreshDto,
  RequestOtpDto,
  SetLanguageDto,
  SetModeDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { OtpRateLimitGuard } from './guards/otp-rate-limit.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { RequestUser } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Req 1: request OTP. 202 regardless of account existence (no enumeration). */
  @Post('otp/request')
  @UseGuards(OtpRateLimitGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.auth.requestOtp(dto.phone);
    return { requested: true };
  }

  /** Req 2: verify OTP credential → issue tokens + user. */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.firebaseIdToken);
  }

  /** Req 4: refresh (rotation + replay defense). */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  /** Req 5: logout (current session or all devices). */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: RequestUser, @Body() dto: LogoutDto) {
    await this.auth.logout(user.userId, dto);
  }

  /** Req 3: set language. */
  @Patch('language')
  @UseGuards(JwtAuthGuard)
  setLanguage(@CurrentUser() user: RequestUser, @Body() dto: SetLanguageDto) {
    return this.auth.setLanguage(user.userId, dto.language);
  }

  /** Current profile (includes language + profileComplete). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.userId);
  }

  /** Update profile (partial): name / district / language / email / avatar. */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.userId, dto);
  }

  /** Presign an avatar upload; client stores the returned fileUrl via PATCH /profile. */
  @Post('profile/avatar/presign')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  avatarPresign(@CurrentUser() user: RequestUser) {
    return this.auth.avatarPresign(user.userId);
  }

  /** Switch active dashboard mode (must be a role the account holds). Issues a fresh token. */
  @Post('mode')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  setMode(@CurrentUser() user: RequestUser, @Body() dto: SetModeDto) {
    return this.auth.setMode(user.userId, dto.mode);
  }

  /** Add the provider role to this account; returns a token already in provider mode. */
  @Post('become-provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  becomeProvider(@CurrentUser() user: RequestUser, @Body() dto: BecomeProviderDto) {
    return this.auth.becomeProvider(user.userId, dto.businessName);
  }
}
