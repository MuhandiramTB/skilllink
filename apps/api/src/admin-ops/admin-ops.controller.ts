import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AdminOpsService } from './admin-ops.service';
import { UserAdminService } from './user-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

class OpenDisputeDto {
  @IsString() @MinLength(3) reason!: string;
}
class ResolveDisputeDto {
  @IsString() @MinLength(3) resolution!: string;
}

@Controller()
export class AdminOpsController {
  constructor(
    private readonly ops: AdminOpsService,
    private readonly users: UserAdminService,
  ) {}

  // ---- User management (admin) ----
  @Get('admin/users')
  @UseGuards(AdminGuard)
  listUsers(@Query('limit') limit?: string, @Query('search') search?: string) {
    return this.users.list(Number(limit ?? 50), 0, search);
  }

  @Patch('admin/users/:id/active')
  @UseGuards(AdminGuard)
  setUserActive(@CurrentUser() a: RequestUser, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.users.setActive(a.userId, id, body.isActive);
  }

  @Post('admin/users/:id/force-logout')
  @UseGuards(AdminGuard)
  forceLogout(@CurrentUser() a: RequestUser, @Param('id') id: string) {
    return this.users.forceLogout(a.userId, id);
  }

  @Post('bookings/:id/dispute')
  @UseGuards(JwtAuthGuard)
  open(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: OpenDisputeDto) {
    return this.ops.openDispute(u.userId, id, dto.reason);
  }

  @Get('admin/disputes')
  @UseGuards(AdminGuard)
  queue() {
    return this.ops.queue();
  }

  @Patch('admin/disputes/:id')
  @UseGuards(AdminGuard)
  resolve(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.ops.resolve(u.userId, id, dto.resolution);
  }

  @Get('admin/analytics')
  @UseGuards(AdminGuard)
  analytics() {
    return this.ops.analytics();
  }

  @Get('admin/bookings')
  @UseGuards(AdminGuard)
  bookings() {
    return this.ops.bookings();
  }

  @Get('admin/payments')
  @UseGuards(AdminGuard)
  payments() {
    return this.ops.payments();
  }

  @Get('admin/audit')
  @UseGuards(AdminGuard)
  audit(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.ops.auditLog(Number(limit ?? 50), Number(offset ?? 0) || 0);
  }
}
