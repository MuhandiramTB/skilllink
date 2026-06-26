import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const DEV_DEFAULT_PAY_SECRET = 'dev-pay-secret';

export interface GatewaySession {
  gatewayRef: string;
  redirectUrl: string;
  idempotencyKey: string;
}

export interface WebhookResult {
  ok: boolean;
  gatewayRef: string;
  idempotencyKey: string;
}

/**
 * Abstraction over the payment gateway (PayHere/Genie). Mock for dev so the whole
 * pay flow is testable without a merchant account. Env PAYMENT_GATEWAY=mock|payhere|genie.
 */
export abstract class PaymentGateway {
  abstract createSession(params: { paymentId: string; amountCents: number }): Promise<GatewaySession>;
  abstract verifyWebhook(payload: Record<string, unknown>, signature?: string): WebhookResult;
}

@Injectable()
export class MockPaymentGateway extends PaymentGateway {
  private readonly secret = process.env.PAYMENT_MOCK_SECRET ?? DEV_DEFAULT_PAY_SECRET;

  constructor() {
    super();
    // Fail fast: never accept webhooks signed with the committed placeholder outside dev.
    if (process.env.NODE_ENV !== 'development' && this.secret === DEV_DEFAULT_PAY_SECRET) {
      throw new Error(
        'PAYMENT_MOCK_SECRET is unset or still the dev placeholder. Set a strong secret (or use a real gateway) before running outside development.',
      );
    }
  }

  async createSession(params: { paymentId: string; amountCents: number }): Promise<GatewaySession> {
    const ref = `mockpay_${params.paymentId.slice(0, 8)}`;
    return {
      gatewayRef: ref,
      redirectUrl: `https://mock-pay.local/checkout/${ref}`,
      idempotencyKey: ref, // deterministic per payment → idempotent
    };
  }

  /**
   * Verify HMAC-SHA256(secret, canonical(payload)) against the supplied signature,
   * compared in constant time. Requires a non-empty gatewayRef + idempotencyKey so a
   * blank-key replay can never match an existing payment row.
   */
  verifyWebhook(payload: Record<string, unknown>, signature?: string): WebhookResult {
    const gatewayRef = String(payload.gatewayRef ?? '');
    const idempotencyKey = String(payload.idempotencyKey ?? payload.gatewayRef ?? '');
    const result: WebhookResult = { ok: false, gatewayRef, idempotencyKey };
    if (!signature || !gatewayRef || !idempotencyKey) return result;

    // Canonical string the gateway would have signed: stable key order.
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    const expected = createHmac('sha256', this.secret).update(canonical).digest('hex');
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    result.ok = a.length === b.length && timingSafeEqual(a, b);
    return result;
  }
}
