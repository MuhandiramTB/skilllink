import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import { SettingsService, type SettingKey } from './settings.service';

/** Admin-only platform settings (spec 16). GET returns all; PUT upserts a patch. */
@Controller('admin/settings')
@UseGuards(AdminGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  all() {
    return this.settings.all();
  }

  @Put()
  update(@CurrentUser() u: RequestUser, @Body() body: Partial<Record<SettingKey, number>>) {
    return this.settings.update(u.userId, body);
  }
}
