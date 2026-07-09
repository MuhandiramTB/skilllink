/**
 * Notification delivery channels (product analysis gap: off-app reach). The
 * NotifierService always writes the in-app record, then fans out to every ENABLED
 * channel. Push (FCM) and SMS are stubbed behind config so wiring a real provider
 * later is a credentials change — no call-site rework. Email logs in dev and can
 * point at a real transport when configured.
 */
export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  /** Best-effort delivery targets, resolved by the notifier when available. */
  email?: string | null;
  phone?: string | null;
}

export interface NotificationChannel {
  readonly name: string;
  /** True when the channel is configured/enabled (else the notifier skips it). */
  enabled(): boolean;
  send(payload: NotificationPayload): Promise<void>;
}
