import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { MockFirebaseVerifier } from './firebase/firebase-verifier';

describe('AuthService — verify & upsert (Req 2)', () => {
  const tokens = new TokenService();
  const verifier = new MockFirebaseVerifier();

  function build(existingUser: Record<string, unknown> | null) {
    const created = {
      id: 'new-id',
      phone: '+94771234567',
      role: 'customer',
      language: 'en',
    };
    const prisma = {
      users: {
        findUnique: jest.fn().mockResolvedValue(existingUser),
        create: jest.fn().mockResolvedValue(created),
        // suspension check + deriveRoles re-read the user; default to active.
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...(existingUser ?? created), is_active: true }),
      },
      // deriveRoles checks for a providers row; default: not a provider.
      providers: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const sessions = {
      create: jest.fn().mockResolvedValue({ refreshToken: 'raw-refresh' }),
    } as unknown as SessionService;
    const svc = new AuthService(prisma as never, tokens, sessions, verifier);
    return { svc, prisma };
  }

  it('creates a new user with defaults role=customer, language=en (Req 2.4)', async () => {
    const { svc, prisma } = build(null);
    const out = await svc.verifyOtp('mock:+94771234567');
    expect(prisma.users.create).toHaveBeenCalled();
    expect(out.user.roles).toEqual(['customer']);
    expect(out.user.mode).toBe('customer');
    expect(out.user.language).toBe('en');
    expect(out.accessToken).toBeDefined();
    expect(out.refreshToken).toBe('raw-refresh');
  });

  it('reuses an existing user (no duplicate create)', async () => {
    const existing = { id: 'u9', phone: '+94771234567', role: 'customer', language: 'si' };
    const { svc, prisma } = build(existing);
    const out = await svc.verifyOtp('mock:+94771234567');
    expect(prisma.users.create).not.toHaveBeenCalled();
    expect(out.user.id).toBe('u9');
    expect(out.user.roles).toContain('customer');
  });

  it('rejects an invalid OTP token with AUTH_OTP_INVALID (Req 2.3)', async () => {
    const { svc } = build(null);
    await expect(svc.verifyOtp('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
