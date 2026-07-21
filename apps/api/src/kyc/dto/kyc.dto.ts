import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * KYC submission (Spec 18). Images arrive as data URLs or hosted URLs; we cap the
 * string length generously (~large data URL) so a base64 photo fits but a payload
 * bomb doesn't. The API body limit (12mb, main.ts) is the outer guard.
 */
export class KycSubmitDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(30) documentNumber?: string;

  @IsString() @MinLength(1) @MaxLength(11_000_000) nicFrontUrl!: string;
  @IsString() @MinLength(1) @MaxLength(11_000_000) nicBackUrl!: string;
  @IsString() @MinLength(1) @MaxLength(11_000_000) selfieUrl!: string;

  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true })
  livenessChallenges?: string[];
}
