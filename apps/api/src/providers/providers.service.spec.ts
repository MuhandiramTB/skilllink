import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
  it('publicProfile: verified=true only when status=approved (Req 4 trust)', async () => {
    const prisma = {
      providers: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ user_id: 'p1', business_name: 'X', rating_avg: 4.5, rating_count: 10, status: 'approved' })
          .mockResolvedValueOnce({ user_id: 'p2', business_name: 'Y', rating_avg: 0, rating_count: 0, status: 'pending' }),
      },
    };
    const svc = new ProvidersService(prisma as never);
    expect((await svc.publicProfile('p1')).verified).toBe(true);
    expect((await svc.publicProfile('p2')).verified).toBe(false);
  });

  it('publicProfile: unknown provider → 404', async () => {
    const prisma = { providers: { findUnique: jest.fn().mockResolvedValue(null) } };
    const svc = new ProvidersService(prisma as never);
    await expect(svc.publicProfile('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('become: admin cannot become a provider (403)', async () => {
    const prisma = {
      providers: { findUnique: jest.fn().mockResolvedValue(null) },
      users: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'a1', role: 'admin', district_id: null }) },
    };
    const svc = new ProvidersService(prisma as never);
    await expect(svc.become('a1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });
});
