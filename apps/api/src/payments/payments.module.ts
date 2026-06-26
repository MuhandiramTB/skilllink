import { Module } from '@nestjs/common';
import { PaymentsController, EarningsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentGateway, MockPaymentGateway } from './gateway/payment-gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, EarningsController],
  providers: [
    PaymentsService,
    JwtAuthGuard,
    { provide: PaymentGateway, useClass: MockPaymentGateway },
  ],
})
export class PaymentsModule {}
