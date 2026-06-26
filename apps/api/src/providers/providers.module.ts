import { Module } from '@nestjs/common';
import { ProvidersController, AdminVerificationController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { VerificationService } from './verification.service';
import { MediaUploader, MockMediaUploader } from './media/media-uploader';
import { AuditService } from '../admin/audit.service';
import { AdminGuard } from '../admin/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // TokenService for JwtAuthGuard + AdminGuard
  controllers: [ProvidersController, AdminVerificationController],
  providers: [
    ProvidersService,
    VerificationService,
    AuditService,
    AdminGuard,
    JwtAuthGuard,
    // mock by default; CloudinaryUploader drops in later via env
    { provide: MediaUploader, useClass: MockMediaUploader },
  ],
})
export class ProvidersModule {}
