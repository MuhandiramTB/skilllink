import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../admin/audit.service';
import { NotifierService } from '../notifications/notifier.service';
import { KycProvider, KycResult, KycSubmission } from './kyc-provider';
import { OnfidoKycProvider } from './onfido-provider';

/**
 * Orchestrates a provider's identity verification (Spec 18):
 * capture → vendor → persist the attempt in kyc_checks → mirror the outcome into the
 * legacy `verifications` rows + provider status so the existing admin queue and the
 * `verified` badge keep working. One source of truth (the vendor), many consumers.
 */
@Injectable()
export class KycService {
  private readonly log = new Logger('KycService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: KycProvider,
    private readonly audit: AuditService,
    private readonly notifier: NotifierService,
    // Only used to interpret Onfido webhooks; safe to inject even under mock.
    private readonly onfido: OnfidoKycProvider,
  ) {}

  /** Provider submits NIC front/back + liveness selfie for verification. */
  async submit(providerId: string, dto: KycSubmission): Promise<{ id: string; status: string; reason: string | null }> {
    const provider = await this.prisma.providers.findUnique({ where: { user_id: providerId } });
    if (!provider) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.providers.notFound' });
    if (!dto.nicFrontUrl || !dto.nicBackUrl || !dto.selfieUrl) {
      throw new BadRequestException({ code: 'KYC_INCOMPLETE', message: 'errors.kyc.incompleteEvidence' });
    }

    const result = await this.provider.verify({ ...dto, providerId });

    const row = await this.prisma.kyc_checks.create({
      data: {
        provider_id: providerId,
        vendor: result.vendor,
        vendor_check_id: result.vendorCheckId,
        status: result.status,
        document_ok: result.documentOk,
        face_match: result.faceMatch,
        liveness_ok: result.livenessOk,
        score: result.score,
        reason: result.reason,
        raw: (result.raw ?? {}) as object,
      },
    });

    await this.applyOutcome(providerId, result, dto);
    return { id: row.id, status: result.status, reason: result.reason };
  }

  /** Latest KYC attempt for the provider dashboard / wizard resume. */
  async status(providerId: string) {
    const latest = await this.prisma.kyc_checks.findFirst({
      where: { provider_id: providerId },
      orderBy: { created_at: 'desc' },
    });
    if (!latest) return { status: 'none' as const };
    return {
      status: latest.status,
      vendor: latest.vendor,
      documentOk: latest.document_ok,
      faceMatch: latest.face_match,
      livenessOk: latest.liveness_ok,
      reason: latest.reason,
      submittedAt: latest.created_at,
    };
  }

  /** Vendor webhook (Onfido) — finalise an async check. Unauthenticated but signature-verified upstream. */
  async handleWebhook(vendor: string, payload: any) {
    if (vendor !== 'onfido') return { ok: false, ignored: vendor };
    const mapped = this.onfido.mapWebhook(payload);
    if (!mapped.vendorCheckId) return { ok: false, reason: 'no check id' };

    const check = await this.prisma.kyc_checks.findFirst({
      where: { vendor_check_id: mapped.vendorCheckId },
      orderBy: { created_at: 'desc' },
    });
    if (!check) return { ok: false, reason: 'unknown check' };

    await this.prisma.kyc_checks.update({
      where: { id: check.id },
      data: {
        status: mapped.status ?? check.status,
        document_ok: mapped.documentOk ?? check.document_ok,
        face_match: mapped.faceMatch ?? check.face_match,
        liveness_ok: mapped.livenessOk ?? check.liveness_ok,
        reason: mapped.reason ?? check.reason,
        raw: (mapped.raw ?? check.raw ?? {}) as object,
        updated_at: new Date(),
      },
    });
    if (mapped.status && mapped.status !== 'pending') {
      await this.applyOutcome(check.provider_id, { ...(mapped as KycResult) }, null);
    }
    return { ok: true };
  }

  /**
   * Mirror a completed KYC result into the legacy verifications rows + provider
   * status, and notify the provider. Automated identity checks make providers
   * self-serve: a `verified` result auto-approves them; a rejection tells them why
   * and lets them retry. (A future policy flag can force manual admin review by
   * leaving status='pending' here.)
   */
  private async applyOutcome(providerId: string, result: Partial<KycResult>, dto: KycSubmission | null) {
    // Record NIC + selfie as the two legacy verification artefacts so the admin
    // queue and public "verified" badge continue to reflect reality.
    if (dto) {
      await this.prisma.verifications.createMany({
        data: [
          { provider_id: providerId, type: 'nic', media_url: dto.nicFrontUrl,
            status: result.status === 'verified' ? 'approved' : result.status === 'rejected' ? 'rejected' : 'pending' },
          { provider_id: providerId, type: 'selfie', media_url: dto.selfieUrl,
            status: result.status === 'verified' ? 'approved' : result.status === 'rejected' ? 'rejected' : 'pending' },
        ],
      });
    }

    if (result.status === 'verified') {
      await this.prisma.providers.update({
        where: { user_id: providerId },
        data: { status: 'approved', is_available: true },
      });
      await this.audit.record({
        actorId: providerId, action: 'provider.kyc_verified', entity: 'providers', entityId: providerId,
        meta: { vendor: result.vendor ?? null, score: result.score ?? null },
      });
      await this.notifier.notify({
        userId: providerId, type: 'provider.approvedd', title: 'You are verified',
        body: 'Your identity was verified. You can now receive jobs.', link: '/provider',
      });
    } else if (result.status === 'rejected') {
      await this.audit.record({
        actorId: providerId, action: 'provider.kyc_rejected', entity: 'providers', entityId: providerId,
        meta: { reason: result.reason ?? null },
      });
      await this.notifier.notify({
        userId: providerId, type: 'provider.rejectedd', title: 'Verification failed',
        body: 'We could not verify your identity. Please retry with clearer photos.', link: '/provider/register',
      });
    }
  }
}
