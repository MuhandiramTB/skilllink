import { IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString, MinLength } from 'class-validator';

export class SetDistrictActiveDto {
  @IsBoolean()
  is_active!: boolean;
}

export class CreateDistrictDto {
  @IsString() @MinLength(1) name_en!: string;
  @IsString() @MinLength(1) name_si!: string;
  @IsString() @MinLength(1) name_ta!: string;
  // District centre. Optional — defaults to Kandy if omitted.
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateDistrictDto {
  @IsOptional() @IsString() @MinLength(1) name_en?: string;
  @IsOptional() @IsString() @MinLength(1) name_si?: string;
  @IsOptional() @IsString() @MinLength(1) name_ta?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
