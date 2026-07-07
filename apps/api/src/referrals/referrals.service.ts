import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const REFERRER_POINTS = Number(process.env.REFERRAL_REFERRER_POINTS ?? 50);
const REFEREE_POINTS = Number(process.env.REFERRAL_REFEREE_POINTS ?? 30);

/**
 * Referral program (spec 15): each user has a shareable code. A new user applies a
 * referrer's code once — both earn reward points. Idempotency is enforced by the
 * referee's referred_by field (set at most once). Point values are admin-editable
 * (live via SettingsService) with env fallbacks.
 */
@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly settings?: SettingsService,
  ) {}

  private async points() {
    if (!this.settings) return { referrer: REFERRER_POINTS, referee: REFEREE_POINTS };
    const [referrer, referee] = await Promise.all([
      this.settings.get('referrer_points'),
      this.settings.get('referee_points'),
    ]);
    return { referrer, referee };
  }

  /** The current user's own code + how many people they've successfully referred. */
  async me(userId: string) {
    const u = await this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: { referral_code: true },
    });
    const referredCount = await this.prisma.users.count({ where: { referred_by: userId } });
    const { referrer, referee } = await this.points();
    return {
      code: u.referral_code,
      referredCount,
      referrerPoints: referrer,
      refereePoints: referee,
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

    const pts = await this.points();
    // Link + award both atomically. reward_ledger booking_id is null for referrals
    // (the partial unique index only guards booking-scoped awards).
    await this.prisma.$transaction([
      this.prisma.users.update({ where: { id: userId }, data: { referred_by: referrer.id, updated_at: new Date() } }),
      this.prisma.reward_points.upsert({
        where: { user_id: referrer.id },
        create: { user_id: referrer.id, points: pts.referrer },
        update: { points: { increment: pts.referrer } },
      }),
      this.prisma.reward_ledger.create({ data: { user_id: referrer.id, points: pts.referrer, reason: 'referral_sender' } }),
      this.prisma.reward_points.upsert({
        where: { user_id: userId },
        create: { user_id: userId, points: pts.referee },
        update: { points: { increment: pts.referee } },
      }),
      this.prisma.reward_ledger.create({ data: { user_id: userId, points: pts.referee, reason: 'referral_signup' } }),
    ]);

    return { applied: true, pointsEarned: pts.referee };
  }
}
