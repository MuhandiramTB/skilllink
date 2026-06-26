import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ChatService } from './chat.service';
import { MatchingService } from '../matching/matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // TokenService for JwtAuthGuard
  controllers: [BookingsController],
  providers: [BookingsService, ChatService, MatchingService, JwtAuthGuard],
})
export class BookingsModule {}
