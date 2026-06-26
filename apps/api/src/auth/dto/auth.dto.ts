import { IsBoolean, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

// E.164 Sri Lankan number: +94 followed by 9 digits.
const LK_PHONE = /^\+94\d{9}$/;

export class RequestOtpDto {
  @Matches(LK_PHONE, { message: 'errors.auth.phoneInvalid' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @MinLength(1)
  firebaseIdToken!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}

export class SetLanguageDto {
  @IsIn(['si', 'ta', 'en'], { message: 'errors.auth.languageInvalid' })
  language!: 'si' | 'ta' | 'en';
}

export class UpdateProfileDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsString() @MinLength(1) districtId!: string;
  @IsIn(['si', 'ta', 'en']) language!: 'si' | 'ta' | 'en';
  @IsOptional() @IsString() email?: string;
}

export class SetModeDto {
  @IsIn(['customer', 'provider', 'admin'], { message: 'errors.auth.modeInvalid' })
  mode!: 'customer' | 'provider' | 'admin';
}

export class BecomeProviderDto {
  @IsOptional() @IsString() @MinLength(2) businessName?: string;
}
