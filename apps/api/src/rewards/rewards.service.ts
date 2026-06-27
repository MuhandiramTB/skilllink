import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Customer loyalty (Spec 11 Req 6). Points awarded internally on paid-completion
 * and on review. Awards are idempotent per (user, booking, reason).
 */
@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Req 6.1: base points = floor(amount_cents / 10000) (1 pt / LKR 100). Idempotent. */
  async awardBookingCompletion(userId: string, bookingId: string, amountCents: number) {
    const points = Math.floor(amountCents / 10000);
    if (points <= 0) return { awarded: false, points: 0 };
    return this.award(userId, bookingId, 'booking_completed', points);
  }

  /** Req 6.2: flat +20 points on review. Idempotent. */
  async awardReview(userId: string, bookingId: string) {
    return this.award(userId, bookingId, 'review', 20);
  }

  /** Req 6.3: current points balance + ledger (last 50). */
  async balance(userId: string) {
    const rp = await this.prisma.reward_points.findUnique({ where: { user_id: userId } });
    const ledger = await this.prisma.reward_ledger.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return { points: rp?.points ?? 0, ledger };
  }

  /** Idempotent award on (user, booking, reason): skip if a ledger row already exists. */
  private async award(userId: string, bookingId: string, reason: string, points: number) {
    const existing = await this.prisma.reward_ledger.findFirst({
      where: { user_id: userId, booking_id: bookingId, reason },
    });
    if (existing) return { awarded: false, points: 0 };

    await this.prisma.$transaction([
      this.prisma.reward_points.upsert({
        where: { user_id: userId },
        create: { user_id: userId, points },
        update: { points: { increment: points } },
      }),
      this.prisma.reward_ledger.create({
        data: { user_id: userId, points, reason, booking_id: bookingId },
      }),
    ]);
    return { awarded: true, points };
  }
}
