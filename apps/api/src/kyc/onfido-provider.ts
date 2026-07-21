import { Injectable, Logger } from '@nestjs/common';
import { KycProvider, KycResult, KycSubmission } from './kyc-provider';

/**
 * Onfido adapter (production-ready scaffold, Spec 18).
 *
 * Wired but inert until KYC_VENDOR=onfido and ONFIDO_API_TOKEN are set. The real
 * Onfido flow is: create applicant → upload document(s) → upload live_photo →
 * create a check with the `document` + `facial_similarity_photo` reports → the
 * check completes asynchronously and Onfido calls our webhook. We map their report
 * breakdowns onto our normalised KycResult so nothing downstream (DB, admin queue,
 * UI) needs to know which vendor produced the result.
 *
 * The HTTP calls are intentionally centralised in `call()` so switching to Persona
 * (or any vendor) is a matter of writing a sibling adapter with the same shape.
 */
@Injectable()
export class OnfidoKycProvider extends KycProvider {
  readonly name = 'onfido';
  private readonly log = new Logger('OnfidoKyc');
  private readonly token = process.env.ONFIDO_API_TOKEN ?? '';
  private readonly base = process.env.ONFIDO_API_BASE ?? 'https://api.eu.onfido.com/v3.6';

  async verify(s: KycSubmission): Promise<KycResult> {
    if (!this.token) {
      // Fail closed: never silently "pass" someone when the vendor isn't configured.
      this.log.error('ONFIDO_API_TOKEN missing — cannot run KYC');
      return this.rejected(null, 'errors.kyc.vendorUnavailable', { misconfigured: true });
    }
    try {
      const applicant = await this.call('POST', '/applicants', {
        first_name: (s.fullName ?? 'SkillLink').split(' ')[0] || 'SkillLink',
        last_name: (s.fullName ?? 'Provider').split(' ').slice(1).join(' ') || 'Provider',
      });
      // NOTE: real uploads are multipart binary; s.*Url must be fetched to buffers
      // first. Left as the single integration point to complete on go-live.
      await this.uploadDocument(applicant.id, 'front', s.nicFrontUrl);
      await this.uploadDocument(applicant.id, 'back', s.nicBackUrl);
      await this.uploadLivePhoto(applicant.id, s.selfieUrl);

      const check = await this.call('POST', '/checks', {
        applicant_id: applicant.id,
        report_names: ['document', 'facial_similarity_photo'],
      });

      // Onfido checks are async; when created we return `pending` and let the
      // webhook (handleWebhook) finalise once reports complete.
      return {
        vendor: this.name,
        vendorCheckId: check.id,
        status: this.mapStatus(check.status, check.result),
        documentOk: null,
        faceMatch: null,
        livenessOk: null,
        score: null,
        reason: null,
        raw: check,
      };
    } catch (e) {
      this.log.error(`Onfido verify failed: ${(e as Error).message}`);
      return this.rejected(null, 'errors.kyc.vendorError', { error: (e as Error).message });
    }
  }

  /** Map an Onfido webhook payload → normalised result. Called by KycService on webhook. */
  mapWebhook(payload: any): Partial<KycResult> & { vendorCheckId: string } {
    const breakdown = payload?.object?.report_breakdown ?? payload?.report_breakdown ?? {};
    const documentOk = this.clean(breakdown?.document?.result);
    const faceMatch = this.clean(breakdown?.facial_similarity_photo?.result);
    const status = this.mapStatus(payload?.object?.status, payload?.object?.result);
    return {
      vendorCheckId: payload?.object?.id ?? payload?.resource_id,
      status,
      documentOk,
      faceMatch,
      livenessOk: faceMatch, // Onfido folds liveness into facial_similarity for photo checks
      reason: status === 'rejected' ? 'errors.kyc.checksFailed' : null,
      raw: payload,
    };
  }

  private mapStatus(status?: string, result?: string): 'pending' | 'verified' | 'rejected' {
    if (status && status !== 'complete') return 'pending';
    return result === 'clear' ? 'verified' : 'rejected';
  }

  private clean(r?: string): boolean | null {
    if (r == null) return null;
    return r === 'clear';
  }

  private rejected(vendorCheckId: string | null, reason: string, raw: unknown): KycResult {
    return {
      vendor: this.name,
      vendorCheckId,
      status: 'rejected',
      documentOk: false,
      faceMatch: false,
      livenessOk: false,
      score: 0,
      reason,
      raw,
    };
  }

  // --- vendor HTTP surface (single integration point) ------------------------
  private async call(method: string, path: string, body?: unknown): Promise<any> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Token token=${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`onfido ${path} → ${res.status}`);
    return res.json();
  }

  private async uploadDocument(applicantId: string, side: 'front' | 'back', _url: string) {
    // Real impl: fetch(_url) → Blob → multipart POST /documents with type=national_identity_card.
    this.log.debug(`(scaffold) upload ${side} document for ${applicantId}`);
  }

  private async uploadLivePhoto(applicantId: string, _url: string) {
    this.log.debug(`(scaffold) upload live_photo for ${applicantId}`);
  }
}
