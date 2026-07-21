import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycProvider, MockKycProvider } from './kyc-provider';
import { OnfidoKycProvider } from './onfido-provider';
import { AuditService } from '../admin/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

/**
 * KYC module (Spec 18). The active vendor is chosen at boot from KYC_VENDOR:
 *   (unset) | 'mock' → MockKycProvider  (dev/CI; auto-verifies well-formed evidence)
 *   'onfido'         → OnfidoKycProvider (needs ONFIDO_API_TOKEN)
 * Everything downstream depends only on the KycProvider abstraction, so switching
 * vendors never touches the service, controller, DB, or UI.
 */
@Module({
  imports: [AuthModule], // TokenService for JwtAuthGuard
  controllers: [KycController],
  providers: [
    KycService,
    AuditService,
    JwtAuthGuard,
    MockKycProvider,
    OnfidoKycProvider,
    {
      provide: KycProvider,
      inject: [MockKycProvider, OnfidoKycProvider],
      useFactory: (mock: MockKycProvider, onfido: OnfidoKycProvider) =>
        (process.env.KYC_VENDOR ?? 'mock') === 'onfido' ? onfido : mock,
    },
  ],
})
export class KycModule {}
