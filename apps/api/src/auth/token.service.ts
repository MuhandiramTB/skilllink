import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';

export type Role = 'customer' | 'provider' | 'admin';

export interface AccessClaims {
  sub: string; // userId
  roles: Role[]; // every role this account holds (customer is always present)
  mode: Role; // the role the dashboard is currently acting as
}

const DEV_DEFAULT_SECRET = 'dev-access-secret-change-me';

/**
 * Token logic (spec 01-authentication-otp, Req 2/4) — multi-role aware:
 *  - access: short-lived JWT (default 15m), { sub, roles[], mode }
 *  - refresh: opaque 256-bit random; only its SHA-256 hash is stored
 */
@Injectable()
export class TokenService {
  private readonly accessSecret: Uint8Array;
  private readonly accessTtl = process.env.JWT_ACCESS_TTL ?? '15m';
  private readonly refreshTtlDays = Number(
    (process.env.JWT_REFRESH_TTL ?? '30d').replace('d', ''),
  );

  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET ?? DEV_DEFAULT_SECRET;
    // Fail fast: never sign tokens with the committed placeholder outside local dev.
    if (process.env.NODE_ENV !== 'development' && secret === DEV_DEFAULT_SECRET) {
      throw new Error(
        'JWT_ACCESS_SECRET is unset or still the dev placeholder. Set a strong unique secret before running outside development.',
      );
    }
    this.accessSecret = new TextEncoder().encode(secret);
  }

  async signAccessToken(claims: AccessClaims): Promise<string> {
    return new SignJWT({ roles: claims.roles, mode: claims.mode })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuedAt()
      .setExpirationTime(this.accessTtl)
      .sign(this.accessSecret);
  }

  async verifyAccessToken(token: string): Promise<AccessClaims> {
    const { payload } = await jwtVerify(token, this.accessSecret, {
      algorithms: ['HS256'],
    });
    const roles = (payload.roles as Role[]) ?? ['customer'];
    const mode = (payload.mode as Role) ?? roles[0] ?? 'customer';
    return { sub: payload.sub as string, roles, mode };
  }

  /** Generates a raw refresh token (returned to client) + its hash (stored). */
  newRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
    const raw = randomBytes(32).toString('hex'); // 256-bit
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
    return { raw, hash: this.hashRefresh(raw), expiresAt };
  }

  hashRefresh(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
