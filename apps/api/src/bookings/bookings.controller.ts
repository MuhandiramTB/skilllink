import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import {
  AssignDto,
  CreateBookingDto,
  RespondDto,
  SendMessageDto,
  UpdateStatusDto,
} from './dto/booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly chat: ChatService,
  ) {}

  @Post()
  create(@CurrentUser() u: RequestUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(u.userId, dto);
  }

  @Get()
  history(@CurrentUser() u: RequestUser, @Query('role') role?: string) {
    return this.bookings.history(u.userId, role === 'provider' ? 'provider' : 'customer');
  }

  @Get('provider/jobs')
  providerJobs(@CurrentUser() u: RequestUser) {
    return this.bookings.providerJobs(u.userId);
  }

  @Get(':id')
  detail(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.bookings.detail(u.userId, id);
  }

  @Get(':id/matches')
  matches(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.bookings.matches(u.userId, id);
  }

  @Post(':id/assign')
  assign(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: AssignDto) {
    return this.bookings.assign(u.userId, id, dto.providerId);
  }

  @Patch(':id/respond')
  respond(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: RespondDto) {
    return this.bookings.respond(u.userId, id, dto.action);
  }

  @Patch(':id/status')
  status(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.bookings.updateStatus(u.userId, id, dto.status);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.bookings.cancel(u.userId, id);
  }

  @Get(':id/messages')
  messages(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.chat.list(u.userId, id);
  }

  @Post(':id/messages')
  send(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chat.send(u.userId, id, dto.body);
  }
}
