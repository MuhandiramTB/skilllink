import { IsBoolean } from 'class-validator';

export class SetDistrictActiveDto {
  @IsBoolean()
  is_active!: boolean;
}
