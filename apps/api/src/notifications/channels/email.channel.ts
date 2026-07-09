import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannel, NotificationPayload } from './channel';

/**
 * Email channel. Enabled when SMTP/provider env is present. Until then it logs the
 * email it *would* send (dev-visible, no dependency). Swap the send() body for a
 * real transport (nodemailer / SES / Resend) — the interface stays identical.
 */
@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = 'email';
  private readonly log = new Logger('EmailChannel');

  enabled(): boolean {
    return !!process.env.EMAIL_FROM && !!process.env.SMTP_URL;
  }

  async send(p: NotificationPayload): Promise<void> {
    if (!p.email) return;
    // TODO(real transport): send via SMTP_URL when configured.
    this.log.log(`email → ${p.email}: [${p.title}] ${p.body ?? ''}`);
  }
}
