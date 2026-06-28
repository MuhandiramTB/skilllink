import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      provider_photos: { findMany: jest.fn().mockResolvedValue([]) },
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

  it('addPhoto: rejects when provider already has 12 photos (Spec 12 Req 1.3)', async () => {
    const prisma = {
      providers: { findUnique: jest.fn().mockResolvedValue({ user_id: 'p1' }) },
      provider_photos: { count: jest.fn().mockResolvedValue(12), create: jest.fn() },
    };
    const svc = new ProvidersService(prisma as never);
    await expect(svc.addPhoto('p1', { url: 'data:img' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.provider_photos.create).not.toHaveBeenCalled();
  });

  it("removePhoto: cannot delete another provider's photo (Spec 12 Req 2.2)", async () => {
    const prisma = {
      provider_photos: {
        findUnique: jest.fn().mockResolvedValue({ id: 'ph1', provider_id: 'someoneElse' }),
        delete: jest.fn(),
      },
    };
    const svc = new ProvidersService(prisma as never);
    await expect(svc.removePhoto('p1', 'ph1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.provider_photos.delete).not.toHaveBeenCalled();
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
