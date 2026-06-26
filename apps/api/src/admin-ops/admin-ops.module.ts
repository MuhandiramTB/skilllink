import { Module } from '@nestjs/common';
import { AdminOpsController } from './admin-ops.controller';
import { AdminOpsService } from './admin-ops.service';
import { UserAdminService } from './user-admin.service';
import { AuditService } from '../admin/audit.service';
import { AdminGuard } from '../admin/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminOpsController],
  providers: [AdminOpsService, UserAdminService, AuditService, AdminGuard, JwtAuthGuard],
})
export class AdminOpsModule {}
