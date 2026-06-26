import { TokenService } from './token.service';

describe('TokenService', () => {
  const svc = new TokenService();

  it('signs and verifies an access token with sub + roles + mode (Req 2.2, 6.1)', async () => {
    const token = await svc.signAccessToken({ sub: 'user-1', roles: ['customer'], mode: 'customer' });
    const claims = await svc.verifyAccessToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.roles).toEqual(['customer']);
    expect(claims.mode).toBe('customer');
  });

  it('carries multiple roles and the active mode', async () => {
    const token = await svc.signAccessToken({ sub: 'u2', roles: ['customer', 'provider'], mode: 'provider' });
    const claims = await svc.verifyAccessToken(token);
    expect(claims.roles).toEqual(['customer', 'provider']);
    expect(claims.mode).toBe('provider');
  });

  it('rejects a tampered token', async () => {
    const token = await svc.signAccessToken({ sub: 'user-1', roles: ['admin'], mode: 'admin' });
    await expect(svc.verifyAccessToken(token + 'x')).rejects.toBeDefined();
  });

  it('refresh token: returns raw + stable hash, never equal (Req 2.5)', () => {
    const { raw, hash, expiresAt } = svc.newRefreshToken();
    expect(raw).toHaveLength(64); // 32 bytes hex
    expect(hash).not.toEqual(raw);
    expect(svc.hashRefresh(raw)).toEqual(hash); // deterministic
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
