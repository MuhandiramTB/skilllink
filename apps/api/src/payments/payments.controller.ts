import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/guards/jwt-auth.guard';
import { InitiatePaymentDto, WebhookDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  initiate(@CurrentUser() u: RequestUser, @Body() dto: InitiatePaymentDto) {
    return this.payments.initiate(u.userId, dto.bookingId, dto.amountCents);
  }

  /** Gateway callback — no JWT; verified by signature. */
  @Post('webhook')
  webhook(@Body() dto: WebhookDto) {
    return this.payments.handleWebhook(dto.payload, dto.signature);
  }
}

@Controller('providers/me')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('earnings')
  earnings(@CurrentUser() u: RequestUser) {
    return this.payments.earnings(u.userId);
  }
}
