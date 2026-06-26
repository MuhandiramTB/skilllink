import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../auth/session.service';
import { AuditService } from '../admin/audit.service';

/**
 * Admin user management (OTP model — no passwords).
 * "Reset access" = suspend (block login) / reactivate / force-logout (revoke sessions).
 * After a force-logout, the user simply requests a new OTP to log back in.
 */
@Injectable()
export class UserAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
  ) {}

  async list(limit = 50, offset = 0, search?: string) {
    const where = search ? { phone: { contains: search } } : {};
    const [rows, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        select: { id: true, phone: true, role: true, is_active: true, language: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.users.count({ where }),
    ]);
    return { total, rows };
  }

  async setActive(adminId: string, userId: string, isActive: boolean) {
    const u = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.user.notFound' });
    await this.prisma.users.update({ where: { id: userId }, data: { is_active: isActive } });
    if (!isActive) await this.sessions.revokeAll(userId); // suspend → also kill sessions
    await this.audit.record({
      actorId: adminId,
      action: isActive ? 'user.reactivate' : 'user.suspend',
      entity: 'users',
      entityId: userId,
    });
    return { id: userId, isActive };
  }

  /** Force-logout: revoke all sessions; user re-logs in via OTP. */
  async forceLogout(adminId: string, userId: string) {
    const u = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.user.notFound' });
    await this.sessions.revokeAll(userId);
    await this.audit.record({ actorId: adminId, action: 'user.force_logout', entity: 'users', entityId: userId });
    return { id: userId, loggedOut: true };
  }
}
