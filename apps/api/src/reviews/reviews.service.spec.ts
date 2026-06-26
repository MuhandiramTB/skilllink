import { BadRequestException, ConflictException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

describe('ReviewsService (Req 1)', () => {
  function build(booking: Record<string, unknown> | null, existing: Record<string, unknown> | null = null) {
    const prisma = {
      bookings: { findUnique: jest.fn().mockResolvedValue(booking) },
      reviews: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn().mockResolvedValue({ id: 'r1', rating: 5 }),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: { _all: 2 } }),
      },
      providers: { update: jest.fn().mockResolvedValue({}) },
    };
    return { svc: new ReviewsService(prisma as never), prisma };
  }

  it('creates a review on a completed booking + recalcs provider rating (Req 1.4)', async () => {
    const { svc, prisma } = build({ id: 'b1', customer_id: 'c1', provider_id: 'p1', status: 'completed' });
    const out = await svc.create('c1', 'b1', 5, 'great');
    expect(out.rating).toBe(5);
    expect(prisma.providers.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ rating_avg: 4.5, rating_count: 2 }) }),
    );
  });

  it('rejects review before completion (Req 1.2)', async () => {
    const { svc } = build({ id: 'b1', customer_id: 'c1', provider_id: 'p1', status: 'accepted' });
    await expect(svc.create('c1', 'b1', 5)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a second review (Req 1.3)', async () => {
    const { svc } = build(
      { id: 'b1', customer_id: 'c1', provider_id: 'p1', status: 'completed' },
      { id: 'existing' },
    );
    await expect(svc.create('c1', 'b1', 5)).rejects.toBeInstanceOf(ConflictException);
  });
});
