import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannel, NotificationPayload } from './channel';

/**
 * SMS channel — STUB. Disabled until an SMS provider is configured (Twilio or a
 * local Sri Lankan gateway e.g. Dialog/Mobitel). Critical for off-app reach:
 * "provider accepted", OTP-adjacent alerts, and safety. When enabled, send() posts
 * to the provider's REST API with the user's phone.
 */
@Injectable()
export class SmsChannel implements NotificationChannel {
  readonly name = 'sms';
  private readonly log = new Logger('SmsChannel');

  enabled(): boolean {
    return !!process.env.SMS_PROVIDER_KEY;
  }

  async send(p: NotificationPayload): Promise<void> {
    if (!p.phone) return;
    // TODO(SMS): POST to the configured SMS gateway with p.phone + a short body.
    this.log.debug(`sms (stub) → ${p.phone}: ${p.title}`);
  }
}
