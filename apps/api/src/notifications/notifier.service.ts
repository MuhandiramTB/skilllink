import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Creates in-app notifications. Other modules call notify() on key events.
 * (Push/email adapters can subscribe here later; for v1 this is the in-app channel.)
 */
@Injectable()
export class NotifierService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(params: { userId: string; type: string; title: string; body?: string; link?: string }) {
    if (!params.userId) return;
    await this.prisma.notifications.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      },
    });
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
