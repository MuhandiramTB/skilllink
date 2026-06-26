import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AdminOpsService } from './admin-ops.service';

describe('AdminOpsService — disputes (Req 1,2)', () => {
  function build(booking: Record<string, unknown> | null, openDispute: Record<string, unknown> | null = null) {
    const prisma = {
      bookings: { findUnique: jest.fn().mockResolvedValue(booking) },
      disputes: {
        findFirst: jest.fn().mockResolvedValue(openDispute),
        create: jest.fn().mockResolvedValue({ id: 'd1', status: 'open' }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    const audit = { record: jest.fn() };
    return { svc: new AdminOpsService(prisma as never, audit as never), prisma };
  }

  it('participant can open a dispute (Req 1.1)', async () => {
    const { svc } = build({ id: 'b1', customer_id: 'c1', provider_id: 'p1', status: 'completed' });
    const out = await svc.openDispute('c1', 'b1', 'work not done');
    expect(out.status).toBe('open');
  });

  it('non-participant blocked (Req 1.2)', async () => {
    const { svc } = build({ id: 'b1', customer_id: 'c1', provider_id: 'p1', status: 'completed' });
    await expect(svc.openDispute('stranger', 'b1', 'x')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('duplicate open dispute → 409 (Req 1.3)', async () => {
    const { svc } = build(
      { id: 'b1', customer_id: 'c1', provider_id: 'p1', status: 'completed' },
      { id: 'existing', status: 'open' },
    );
    await expect(svc.openDispute('c1', 'b1', 'x')).rejects.toBeInstanceOf(ConflictException);
  });
});
