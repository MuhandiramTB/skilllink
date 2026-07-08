import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class MediaItemDto {
  @IsIn(['photo', 'video']) kind!: 'photo' | 'video';
  @IsString() url!: string;
}

export class CreateBookingDto {
  @IsString() categoryKey!: string;
  @IsOptional() @IsString() description?: string;
  @Type(() => Number) @IsLatitude() lat!: number;
  @Type(() => Number) @IsLongitude() lng!: number;

  // Preferred date/time (ISO 8601). Omitted / null = ASAP (on-demand).
  @IsOptional() @IsDateString() scheduledFor?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MediaItemDto)
  media?: MediaItemDto[];

  @IsOptional() @IsObject() solarSpecs?: Record<string, unknown>;
}

/** Reschedule: propose a new date/time (ISO). Either party (customer or assigned provider). */
export class RescheduleDto {
  @IsDateString() scheduledFor!: string;
}

export class AssignDto {
  @IsUUID() providerId!: string;
}

export class RespondDto {
  @IsIn(['accept', 'reject']) action!: 'accept' | 'reject';
}

export class UpdateStatusDto {
  @IsIn(['in_progress', 'completed']) status!: 'in_progress' | 'completed';
}

export class SendMessageDto {
  @IsString() @MinLength(1) body!: string;
}

export class QuoteDto {
  @IsInt() @Min(1) amountCents!: number;
}
