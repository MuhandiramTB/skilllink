import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

// lowercase letters/digits, with optional dot or underscore segments (e.g. solar.ev_charger)
const KEY_RE = /^[a-z0-9]+([._][a-z0-9]+)*$/;

export class CreateCategoryDto {
  @Matches(KEY_RE, { message: 'errors.admin.categoryKeyInvalid' })
  key!: string;

  @IsString() @MinLength(1) name_en!: string;
  @IsString() @MinLength(1) name_si!: string;
  @IsString() @MinLength(1) name_ta!: string;

  @IsOptional() @IsString() parent_id?: string;
  @IsOptional() @IsInt() sort_order?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(1) name_en?: string;
  @IsOptional() @IsString() @MinLength(1) name_si?: string;
  @IsOptional() @IsString() @MinLength(1) name_ta?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsInt() sort_order?: number;
}
