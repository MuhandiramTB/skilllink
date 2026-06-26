import { UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

describe('SessionService — rotation & replay defense (Req 4)', () => {
  const tokens = new TokenService();

  function makePrismaMock(session: Record<string, unknown> | null) {
    return {
      sessions: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(session),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
  }

  it('rotates a valid token: revokes old, issues new (Req 4.1)', async () => {
    const prisma = makePrismaMock({
      id: 's1',
      user_id: 'u1',
      revoked_at: null,
      expires_at: new Date(Date.now() + 1000000),
    });
    const svc = new SessionService(prisma as never, tokens);
    const out = await svc.rotate('rawtoken');
    expect(out.userId).toBe('u1');
    expect(out.refreshToken).toBeDefined();
    expect(prisma.sessions.update).toHaveBeenCalled(); // old revoked
    expect(prisma.sessions.create).toHaveBeenCalled(); // new issued
  });

  it('rejects an expired token (Req 4.2)', async () => {
    const prisma = makePrismaMock({
      id: 's1',
      user_id: 'u1',
      revoked_at: null,
      expires_at: new Date(Date.now() - 1000),
    });
    const svc = new SessionService(prisma as never, tokens);
    await expect(svc.rotate('rawtoken')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('replay: reusing a revoked token revokes ALL sessions (Req 4.3)', async () => {
    const prisma = makePrismaMock({
      id: 's1',
      user_id: 'u1',
      revoked_at: new Date(),
      expires_at: new Date(Date.now() + 1000000),
    });
    const svc = new SessionService(prisma as never, tokens);
    await expect(svc.rotate('rawtoken')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.sessions.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ user_id: 'u1' }) }),
    );
  });

  it('rejects an unknown token (Req 4.2)', async () => {
    const prisma = makePrismaMock(null);
    const svc = new SessionService(prisma as never, tokens);
    await expect(svc.rotate('rawtoken')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
