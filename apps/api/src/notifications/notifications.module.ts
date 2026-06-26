import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotifierService } from './notifier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

/** Global so any module can inject NotifierService to emit events. */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotifierService, JwtAuthGuard],
  exports: [NotifierService],
})
export class NotificationsModule {}
