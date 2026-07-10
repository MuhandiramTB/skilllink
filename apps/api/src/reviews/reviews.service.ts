import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: RewardsService,
  ) {}

  /** Req 1: leave a review (completed-only, once) + recalc provider aggregate. */
  async create(customerId: string, bookingId: string, rating: number, comment?: string) {
    const booking = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.review.bookingNotFound' });
    if (booking.customer_id !== customerId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.review.notYours' });
    }
    if (booking.status !== 'completed') {
      throw new BadRequestException({ code: 'REVIEW_BOOKING_NOT_COMPLETED', message: 'errors.review.notCompleted' });
    }
    if (!booking.provider_id) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.review.noProvider' });
    }
    const existing = await this.prisma.reviews.findUnique({ where: { booking_id: bookingId } });
    if (existing) throw new ConflictException({ code: 'REVIEW_EXISTS', message: 'errors.review.exists' });

    const providerId = booking.provider_id;
    const review = await this.prisma.reviews.create({
      data: { booking_id: bookingId, customer_id: customerId, provider_id: providerId, rating, comment: comment ?? null },
    });
    await this.recalc(providerId);
    // Spec 11 Req 6.2: award the customer +20 reward points (idempotent per booking).
    await this.rewards.awardReview(customerId, bookingId);
    return { id: review.id, rating: review.rating };
  }

  /** Req 1.4: recompute provider rating_avg/rating_count → feeds matching. */
  private async recalc(providerId: string) {
    const agg = await this.prisma.reviews.aggregate({
      where: { provider_id: providerId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avg = agg._avg.rating ?? 0;
    await this.prisma.providers.update({
      where: { user_id: providerId },
      data: {
        rating_avg: Math.round(avg * 10) / 10, // 1 decimal (matches numeric(2,1))
        rating_count: agg._count._all,
      },
    });
  }

  /** Req 2: provider responds to a review of their booking. */
  async respond(providerId: string, reviewId: string, response: string) {
    const review = await this.prisma.reviews.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.review.notFound' });
    if (review.provider_id !== providerId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.review.notYourReview' });
    }
    await this.prisma.reviews.update({ where: { id: reviewId }, data: { provider_response: response } });
    return { id: reviewId };
  }

  /** Req 3: public reviews for a provider. */
  async listForProvider(providerId: string) {
    const rows = await this.prisma.reviews.findMany({
      where: { provider_id: providerId },
      // `id` lets the provider reply to a specific review; it's just a UUID and the
      // reply endpoint is ownership-guarded, so exposing it is safe.
      select: { id: true, rating: true, comment: true, provider_response: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return rows;
  }
}
