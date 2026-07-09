import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannel, NotificationPayload } from './channel';

/**
 * Push (Firebase Cloud Messaging) channel — STUB. Disabled until FCM_SERVER_KEY is
 * set + device tokens are stored per user. When enabled, send() should POST to FCM
 * with the user's device token(s). Kept behind this interface so enabling push is a
 * config + token-store change, not a rewrite of every notify() call.
 */
@Injectable()
export class PushChannel implements NotificationChannel {
  readonly name = 'push';
  private readonly log = new Logger('PushChannel');

  enabled(): boolean {
    return !!process.env.FCM_SERVER_KEY;
  }

  async send(p: NotificationPayload): Promise<void> {
    // TODO(FCM): look up the user's device tokens and POST to FCM.
    this.log.debug(`push (stub) → user ${p.userId}: ${p.title}`);
  }
}
