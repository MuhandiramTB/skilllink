import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

/**
 * Session lifecycle (spec Req 2.5, 4, 5):
 *  - create on login; store only the refresh hash
 *  - rotate on refresh (revoke old, issue new)
 *  - replay defense: presenting an already-revoked token revokes ALL user sessions
 *  - revoke one / all on logout
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /** Create a new session, return the raw refresh token. */
  async create(userId: string): Promise<{ refreshToken: string }> {
    const { raw, hash, expiresAt } = this.tokens.newRefreshToken();
    await this.prisma.sessions.create({
      data: { user_id: userId, refresh_token_hash: hash, expires_at: expiresAt },
    });
    return { refreshToken: raw };
  }

  /**
   * Rotate: validate the presented refresh token, revoke it, issue a new one.
   * Throws UnauthorizedException on expired/unknown; on REVOKED reuse it also
   * revokes all of the user's sessions (replay defense, Req 4.3).
   */
  async rotate(rawToken: string): Promise<{ userId: string; refreshToken: string }> {
    const hash = this.tokens.hashRefresh(rawToken);
    const session = await this.prisma.sessions.findFirst({
      where: { refresh_token_hash: hash },
    });

    if (!session) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.session.unknown' });

    // Replay: token was already revoked → revoke everything for this user.
    if (session.revoked_at) {
      await this.revokeAll(session.user_id);
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.session.replay' });
    }

    if (session.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'errors.session.expired' });
    }

    // Revoke old, create new (rotation).
    await this.prisma.sessions.update({
      where: { id: session.id },
      data: { revoked_at: new Date() },
    });
    const { refreshToken } = await this.create(session.user_id);
    return { userId: session.user_id, refreshToken };
  }

  /** Revoke the session matching this refresh token (logout). */
  async revokeByToken(rawToken: string): Promise<void> {
    const hash = this.tokens.hashRefresh(rawToken);
    await this.prisma.sessions.updateMany({
      where: { refresh_token_hash: hash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  /** Revoke every active session for a user (logout-all / replay defense). */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.sessions.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
