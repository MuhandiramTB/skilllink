import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BecomeProviderDto {
  @IsOptional() @IsString() @MinLength(2) businessName?: string;
}

export class AddVerificationDto {
  @IsIn(['nic', 'selfie', 'certificate', 'police_clearance'])
  type!: 'nic' | 'selfie' | 'certificate' | 'police_clearance';

  @IsString() @MinLength(1) mediaUrl!: string;
}

export class ServiceAreaDto {
  @Type(() => Number) @IsLatitude() lat!: number;
  @Type(() => Number) @IsLongitude() lng!: number;
  @Type(() => Number) @IsNumber() @Min(500) @Max(50000) radiusMeters!: number;
}

/** One area within a multi-town selection; optional label = the town name. */
export class ServiceAreaItemDto {
  @Type(() => Number) @IsLatitude() lat!: number;
  @Type(() => Number) @IsLongitude() lng!: number;
  @Type(() => Number) @IsNumber() @Min(500) @Max(50000) radiusMeters!: number;
  @IsOptional() @IsString() label?: string;
}

export class ServiceAreasDto {
  @IsArray() @ArrayNotEmpty()
  @ValidateNested({ each: true }) @Type(() => ServiceAreaItemDto)
  areas!: ServiceAreaItemDto[];
}

export class SetCategoriesDto {
  @IsArray() @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}

export class AvailabilityDto {
  @IsBoolean() isAvailable!: boolean;
}

export class VerificationDecisionDto {
  @IsIn(['approve', 'reject']) decision!: 'approve' | 'reject';
  @IsOptional() @IsString() reason?: string;
}

export class WalletTopupDto {
  @IsInt() @Min(1) amountCents!: number;
}

export class AddPhotoDto {
  @IsString() @MinLength(1) url!: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsUUID() categoryId?: string;
}
