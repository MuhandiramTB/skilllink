import { Injectable, Logger } from '@nestjs/common';

/**
 * KYC provider abstraction (Spec 18).
 *
 * Real identity verification — document authenticity, biometric face-match, and
 * liveness/anti-spoof — is a vendor capability, not something an app can honestly
 * implement in-process. So we model it as a pluggable provider: the app captures
 * the NIC (front + back) and a guided liveness selfie, hands them to a KycProvider,
 * and stores the normalised result. Swapping mock → Onfido/Persona in production is
 * a one-line binding change in the module (driven by KYC_VENDOR env), with no changes
 * to the controller, DB, or UI.
 */

export type KycStatus = 'pending' | 'verified' | 'rejected';

/** The captured evidence a provider submits for one verification attempt. */
export interface KycSubmission {
  /** Our provider (user) id — used as the vendor applicant reference. */
  providerId: string;
  fullName?: string | null;
  /** NIC / national id number the applicant typed, for OCR cross-check. */
  documentNumber?: string | null;
  /** NIC front image (data URL or hosted URL). */
  nicFrontUrl: string;
  /** NIC back image. */
  nicBackUrl: string;
  /** Guided liveness selfie (single frame or short-clip poster). */
  selfieUrl: string;
  /**
   * Ordered liveness challenges the client claims the user completed
   * (e.g. ['blink','turn_left','smile']). Real vendors verify these server-side
   * from the captured clip; we record what the client asked for as an audit trail.
   */
  livenessChallenges?: string[];
}

/** Normalised result across every vendor. */
export interface KycResult {
  vendor: string;
  /** Vendor's opaque id for polling / webhook correlation. */
  vendorCheckId: string | null;
  status: KycStatus;
  /** NIC is authentic + OCR matched the typed number. */
  documentOk: boolean | null;
  /** Selfie face matches the ID portrait. */
  faceMatch: boolean | null;
  /** Selfie is a live human (passed anti-spoof). */
  livenessOk: boolean | null;
  /** Overall confidence 0..1. */
  score: number | null;
  /** Human-readable rejection reason, if rejected. */
  reason: string | null;
  /** The vendor's full raw response, stored for audit. */
  raw: unknown;
}

/** The contract every vendor adapter implements. */
export abstract class KycProvider {
  abstract readonly name: string;
  /** Run (or start) a verification for one submission. */
  abstract verify(submission: KycSubmission): Promise<KycResult>;
}

/**
 * Dev/CI adapter. Deterministically auto-passes a well-formed submission so the
 * whole flow (capture → submit → status → admin queue) is testable without a
 * vendor account, while still rejecting obviously incomplete evidence so the UI's
 * failure paths are exercised too. NEVER selected in production (guarded by env).
 */
@Injectable()
export class MockKycProvider extends KycProvider {
  readonly name = 'mock';
  private readonly log = new Logger('MockKyc');

  async verify(s: KycSubmission): Promise<KycResult> {
    const hasAllImages = Boolean(s.nicFrontUrl && s.nicBackUrl && s.selfieUrl);
    const hasLiveness = (s.livenessChallenges?.length ?? 0) >= 2;

    if (!hasAllImages) {
      return this.result('rejected', {
        documentOk: Boolean(s.nicFrontUrl && s.nicBackUrl),
        faceMatch: false,
        livenessOk: false,
        score: 0,
        reason: 'errors.kyc.incompleteEvidence',
      });
    }
    if (!hasLiveness) {
      return this.result('rejected', {
        documentOk: true,
        faceMatch: true,
        livenessOk: false,
        score: 0.4,
        reason: 'errors.kyc.livenessFailed',
      });
    }
    this.log.debug(`mock KYC auto-verify for ${s.providerId}`);
    return this.result('verified', {
      documentOk: true,
      faceMatch: true,
      livenessOk: true,
      score: 0.97,
      reason: null,
    });
  }

  private result(
    status: KycStatus,
    p: Pick<KycResult, 'documentOk' | 'faceMatch' | 'livenessOk' | 'score' | 'reason'>,
  ): KycResult {
    return {
      vendor: this.name,
      vendorCheckId: `mock_${status}`,
      status,
      ...p,
      raw: { vendor: 'mock', simulated: true, ...p, status },
    };
  }
}
