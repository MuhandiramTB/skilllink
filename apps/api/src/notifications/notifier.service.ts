import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { SmsChannel } from './channels/sms.channel';
import type { NotificationChannel } from './channels/channel';

/**
 * Creates the in-app notification (always) and fans out to every ENABLED external
 * channel (email / push / SMS). Channels are stubbed until configured, so calling
 * notify() is safe everywhere today and gains real off-app delivery the moment a
 * provider is wired — no call-site changes. (Product analysis gap: off-app reach.)
 */
@Injectable()
export class NotifierService {
  private readonly log = new Logger('NotifierService');
  private readonly channels: NotificationChannel[];

  constructor(
    private readonly prisma: PrismaService,
    email: EmailChannel,
    push: PushChannel,
    sms: SmsChannel,
  ) {
    this.channels = [email, push, sms];
  }

  async notify(params: { userId: string; type: string; title: string; body?: string; link?: string }) {
    if (!params.userId) return;
    // 1) Always persist the in-app record.
    await this.prisma.notifications.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      },
    });
    // 2) Fan out to enabled external channels (best-effort; never block/throw the
    //    core action if a channel fails).
    const active = this.channels.filter((c) => c.enabled());
    if (active.length === 0) return;
    let contact: { email: string | null; phone: string | null } = { email: null, phone: null };
    try {
      const u = await this.prisma.users.findUnique({
        where: { id: params.userId },
        select: { phone: true },
      });
      contact = { email: null, phone: u?.phone ?? null };
    } catch { /* contact lookup best-effort */ }
    await Promise.allSettled(
      active.map((c) =>
        c.send({ ...params, email: contact.email, phone: contact.phone }).catch((e) => {
          this.log.warn(`channel ${c.name} failed: ${(e as Error).message}`);
        }),
      ),
    );
  }

  list(userId: string, limit = 30) {
    return this.prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notifications.count({ where: { user_id: userId, read_at: null } });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notifications.updateMany({
      where: { id, user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notifications.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
    return { ok: true };
  }
}
