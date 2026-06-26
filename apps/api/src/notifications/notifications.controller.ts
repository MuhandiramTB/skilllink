import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotifierService } from './notifier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifier: NotifierService) {}

  @Get()
  list(@CurrentUser() u: RequestUser) {
    return this.notifier.list(u.userId);
  }

  @Get('unread-count')
  async unread(@CurrentUser() u: RequestUser) {
    return { count: await this.notifier.unreadCount(u.userId) };
  }

  @Patch('read-all')
  readAll(@CurrentUser() u: RequestUser) {
    return this.notifier.markAllRead(u.userId);
  }

  @Patch(':id/read')
  read(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.notifier.markRead(u.userId, id);
  }
}
