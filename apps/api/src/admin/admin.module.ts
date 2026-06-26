import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminDistrictsService } from './admin-districts.service';
import { AuditService } from './audit.service';
import { AdminGuard } from './admin.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // for TokenService used by AdminGuard
  controllers: [AdminController],
  providers: [AdminCategoriesService, AdminDistrictsService, AuditService, AdminGuard],
})
export class AdminModule {}
