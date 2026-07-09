import { IsOptional, IsString, IsNumber, MinLength, MaxLength, IsIn } from 'class-validator';

/** Customer raises an SOS/safety alarm — optionally tied to a booking + location. */
export class SafetyAlertDto {
  @IsOptional() @IsString() bookingId?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

/** Customer reports a provider (safety, fraud, no-show, quality). */
export class ReportProviderDto {
  @IsString() providerId!: string;
  @IsOptional() @IsString() bookingId?: string;
  @IsIn(['safety', 'fraud', 'no_show', 'quality', 'other'])
  reason!: 'safety' | 'fraud' | 'no_show' | 'quality' | 'other';
  @IsOptional() @IsString() @MaxLength(1000) detail?: string;
}

/** A trusted contact a customer can share a live job with. */
export class TrustedContactDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsString() @MinLength(5) @MaxLength(20) phone!: string;
}
