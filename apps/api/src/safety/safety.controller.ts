import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import { SafetyAlertDto, ReportProviderDto, TrustedContactDto } from './dto/safety.dto';

@Controller()
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  // ── SOS ──────────────────────────────────────────────────────────────────
  @Post('safety/alert')
  @UseGuards(JwtAuthGuard)
  raise(@CurrentUser() u: RequestUser, @Body() dto: SafetyAlertDto) {
    return this.safety.raiseAlert(u.userId, dto);
  }

  @Patch('safety/alert/:id/resolve')
  @UseGuards(JwtAuthGuard)
  resolve(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.safety.resolveAlert(u.userId, id);
  }

  // ── Report a provider ─────────────────────────────────────────────────────
  @Post('safety/report')
  @UseGuards(JwtAuthGuard)
  report(@CurrentUser() u: RequestUser, @Body() dto: ReportProviderDto) {
    return this.safety.reportProvider(u.userId, dto);
  }

  // ── Trusted contacts ──────────────────────────────────────────────────────
  @Get('safety/contacts')
  @UseGuards(JwtAuthGuard)
  listContacts(@CurrentUser() u: RequestUser) {
    return this.safety.listContacts(u.userId);
  }

  @Post('safety/contacts')
  @UseGuards(JwtAuthGuard)
  addContact(@CurrentUser() u: RequestUser, @Body() dto: TrustedContactDto) {
    return this.safety.addContact(u.userId, dto);
  }

  @Delete('safety/contacts/:id')
  @UseGuards(JwtAuthGuard)
  removeContact(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.safety.removeContact(u.userId, id);
  }

  // ── Admin trust queue ─────────────────────────────────────────────────────
  @Get('admin/safety/reports')
  @UseGuards(JwtAuthGuard)
  adminReports() {
    return this.safety.adminOpenReports();
  }

  @Get('admin/safety/alerts')
  @UseGuards(JwtAuthGuard)
  adminAlerts() {
    return this.safety.adminActiveAlerts();
  }
}
