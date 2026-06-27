import { Type } from 'class-transformer';
import {
  IsArray,
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

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MediaItemDto)
  media?: MediaItemDto[];

  @IsOptional() @IsObject() solarSpecs?: Record<string, unknown>;
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
