import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotifierService } from './notifier.service';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { SmsChannel } from './channels/sms.channel';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

/** Global so any module can inject NotifierService to emit events. */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotifierService, EmailChannel, PushChannel, SmsChannel, JwtAuthGuard],
  exports: [NotifierService],
})
export class NotificationsModule {}
