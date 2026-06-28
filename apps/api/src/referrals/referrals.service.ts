import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REFERRER_POINTS = Number(process.env.REFERRAL_REFERRER_POINTS ?? 50);
const REFEREE_POINTS = Number(process.env.REFERRAL_REFEREE_POINTS ?? 30);

/**
 * Referral program (spec 15): each user has a shareable code. A new user applies a
 * referrer's code once — both earn reward points. Idempotency is enforced by the
 * referee's referred_by field (set at most once).
 */
@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The current user's own code + how many people they've successfully referred. */
  async me(userId: string) {
    const u = await this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: { referral_code: true },
    });
    const referredCount = await this.prisma.users.count({ where: { referred_by: userId } });
    return {
      code: u.referral_code,
      referredCount,
      referrerPoints: REFERRER_POINTS,
      refereePoints: REFEREE_POINTS,
    };
  }

  /**
   * Apply a referrer's code. The caller is the referee (new user). Awards both.
   * Rules: referee must not already be referred; cannot use own code; code must exist.
   */
  async apply(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const me = await this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: { referred_by: true, referral_code: true },
    });
    if (me.referred_by) {
      throw new BadRequestException({ code: 'REFERRAL_ALREADY_APPLIED', message: 'errors.referral.alreadyApplied' });
    }
    if (me.referral_code === code) {
      throw new BadRequestException({ code: 'REFERRAL_SELF', message: 'errors.referral.self' });
    }
    const referrer = await this.prisma.users.findUnique({
      where: { referral_code: code },
      select: { id: true },
    });
    if (!referrer) {
      throw new NotFoundException({ code: 'REFERRAL_CODE_INVALID', message: 'errors.referral.invalid' });
    }

    // Link + award both atomically. reward_ledger booking_id is null for referrals
    // (the partial unique index only guards booking-scoped awards).
    await this.prisma.$transaction([
      this.prisma.users.update({ where: { id: userId }, data: { referred_by: referrer.id, updated_at: new Date() } }),
      this.prisma.reward_points.upsert({
        where: { user_id: referrer.id },
        create: { user_id: referrer.id, points: REFERRER_POINTS },
        update: { points: { increment: REFERRER_POINTS } },
      }),
      this.prisma.reward_ledger.create({ data: { user_id: referrer.id, points: REFERRER_POINTS, reason: 'referral_sender' } }),
      this.prisma.reward_points.upsert({
        where: { user_id: userId },
        create: { user_id: userId, points: REFEREE_POINTS },
        update: { points: { increment: REFEREE_POINTS } },
      }),
      this.prisma.reward_ledger.create({ data: { user_id: userId, points: REFEREE_POINTS, reason: 'referral_signup' } }),
    ]);

    return { applied: true, pointsEarned: REFEREE_POINTS };
  }
}
