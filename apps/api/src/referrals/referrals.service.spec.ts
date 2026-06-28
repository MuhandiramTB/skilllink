import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

describe('ReferralsService', () => {
  it('apply: rejects when the user was already referred (Spec 15 Req 2.2)', async () => {
    const prisma = {
      users: { findUniqueOrThrow: jest.fn().mockResolvedValue({ referred_by: 'someone', referral_code: 'SKAAA111' }) },
    };
    const svc = new ReferralsService(prisma as never);
    await expect(svc.apply('u1', 'SKBBB222')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('apply: rejects using your own code (Spec 15 Req 2.3)', async () => {
    const prisma = {
      users: { findUniqueOrThrow: jest.fn().mockResolvedValue({ referred_by: null, referral_code: 'SKMINE00' }) },
    };
    const svc = new ReferralsService(prisma as never);
    await expect(svc.apply('u1', 'skmine00')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('apply: 404 when the code does not exist (Spec 15 Req 2.4)', async () => {
    const prisma = {
      users: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ referred_by: null, referral_code: 'SKMINE00' }),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const svc = new ReferralsService(prisma as never);
    await expect(svc.apply('u1', 'SKNOPE99')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('apply: links + awards both in one transaction (Spec 15 Req 2.1/2.5)', async () => {
    const tx = jest.fn().mockResolvedValue([]);
    const prisma = {
      users: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ referred_by: null, referral_code: 'SKMINE00' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'referrer1' }),
        update: jest.fn(),
      },
      reward_points: { upsert: jest.fn() },
      reward_ledger: { create: jest.fn() },
      $transaction: tx,
    };
    const svc = new ReferralsService(prisma as never);
    const res = await svc.apply('u1', 'SKREF123');
    expect(res.applied).toBe(true);
    expect(tx).toHaveBeenCalledTimes(1);
    // 5 ops: link + (referrer upsert + ledger) + (referee upsert + ledger)
    expect(tx.mock.calls[0][0]).toHaveLength(5);
  });
});
