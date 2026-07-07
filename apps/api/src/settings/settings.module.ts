import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../admin/admin.guard';

/**
 * Global so payments/rewards/matching can inject SettingsService to read live config.
 * The admin controller (GET/PUT) is guarded by AdminGuard.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService, AdminGuard],
  exports: [SettingsService],
})
export class SettingsModule {}
