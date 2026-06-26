import { NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';

describe('VerificationService — approve/reject (Req 4)', () => {
  function build(provider: Record<string, unknown> | null) {
    const prisma = {
      providers: { findUnique: jest.fn().mockResolvedValue(provider), update: jest.fn() },
      verifications: { updateMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const notifier = { notify: jest.fn().mockResolvedValue(undefined) };
    return { svc: new VerificationService(prisma as never, audit as never, notifier as never), prisma, audit };
  }

  it('approve → status approved + audited (Req 4.1)', async () => {
    const { svc, prisma, audit } = build({ user_id: 'p1', status: 'pending' });
    const out = await svc.decide('admin1', 'p1', 'approve');
    expect(out.status).toBe('approved');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'provider.approve', entityId: 'p1' }),
    );
  });

  it('reject → status rejected with reason (Req 4.2)', async () => {
    const { svc, audit } = build({ user_id: 'p1', status: 'pending' });
    const out = await svc.decide('admin1', 'p1', 'reject', 'blurry NIC');
    expect(out.status).toBe('rejected');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'provider.reject', meta: { reason: 'blurry NIC' } }),
    );
  });

  it('unknown provider → 404', async () => {
    const { svc } = build(null);
    await expect(svc.decide('admin1', 'nope', 'approve')).rejects.toBeInstanceOf(NotFoundException);
  });
});
