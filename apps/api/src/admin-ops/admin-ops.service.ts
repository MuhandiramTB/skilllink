import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../admin/audit.service';

@Injectable()
export class AdminOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Req 1: a booking participant opens a dispute. */
  async openDispute(userId: string, bookingId: string, reason: string) {
    const b = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.dispute.bookingNotFound' });
    if (b.customer_id !== userId && b.provider_id !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.dispute.notParticipant' });
    }
    const open = await this.prisma.disputes.findFirst({ where: { booking_id: bookingId, status: 'open' } });
    if (open) throw new ConflictException({ code: 'DISPUTE_EXISTS', message: 'errors.dispute.exists' });

    const d = await this.prisma.disputes.create({
      data: { booking_id: bookingId, opened_by: userId, status: 'open', resolution: reason },
    });
    return { id: d.id, status: d.status };
  }

  /** Req 2: admin dispute queue. */
  queue() {
    return this.prisma.disputes.findMany({
      where: { status: 'open' },
      orderBy: { created_at: 'asc' },
    });
  }

  /** Req 2: admin resolves a dispute (audited). */
  async resolve(adminId: string, disputeId: string, resolution: string) {
    const d = await this.prisma.disputes.findUnique({ where: { id: disputeId } });
    if (!d) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.dispute.notFound' });
    const updated = await this.prisma.disputes.update({
      where: { id: disputeId },
      data: { status: 'resolved', resolution, resolved_by: adminId },
    });
    await this.audit.record({ actorId: adminId, action: 'dispute.resolve', entity: 'disputes', entityId: disputeId });
    return { id: updated.id, status: updated.status };
  }

  /** Audit log viewer (admin) — most recent first, paginated. */
  async auditLog(limit = 50, offset = 0) {
    const [rows, total] = await Promise.all([
      this.prisma.audit_log.findMany({
        orderBy: { created_at: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      this.prisma.audit_log.count(),
    ]);
    return { total, rows };
  }

  /** Admin: recent bookings across the platform (with category key). */
  async bookings(limit = 50) {
    const rows = await this.prisma.bookings.findMany({
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 200),
      select: { id: true, status: true, category_id: true, price_cents: true, created_at: true },
    });
    const cats = await this.prisma.categories.findMany({ select: { id: true, key: true } });
    const keyById = new Map(cats.map((c) => [c.id, c.key]));
    return rows.map((r) => ({ ...r, categoryKey: keyById.get(r.category_id) ?? null }));
  }

  /** Admin: payments ledger. */
  async payments(limit = 50) {
    return this.prisma.payments.findMany({
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 200),
      select: { id: true, amount_cents: true, commission_cents: true, status: true, provider: true, created_at: true },
    });
  }

  /** Req 3: business analytics snapshot. */
  async analytics() {
    const byStatus = await this.prisma.bookings.groupBy({ by: ['status'], _count: { _all: true } });
    const money = await this.prisma.$queryRawUnsafe<
      { gross: bigint | null; commission: bigint | null; paid_count: bigint }[]
    >(
      `SELECT COALESCE(SUM(amount_cents),0) AS gross,
              COALESCE(SUM(commission_cents),0) AS commission,
              COUNT(*) AS paid_count
       FROM payments WHERE status='paid'`,
    );
    const providers = await this.prisma.providers.groupBy({ by: ['status'], _count: { _all: true } });
    const customers = await this.prisma.users.count({ where: { role: 'customer' } });
    const activeDistricts = await this.prisma.districts.count({ where: { is_active: true } });

    const bookingsByStatus: Record<string, number> = {};
    byStatus.forEach((r) => (bookingsByStatus[r.status] = r._count._all));
    const providersByStatus: Record<string, number> = {};
    providers.forEach((r) => (providersByStatus[r.status] = r._count._all));

    return {
      bookings: {
        total: byStatus.reduce((s, r) => s + r._count._all, 0),
        byStatus: bookingsByStatus,
        completed: bookingsByStatus['completed'] ?? 0,
      },
      revenue: {
        grossCents: Number(money[0]?.gross ?? 0),
        commissionCents: Number(money[0]?.commission ?? 0),
        paidPayments: Number(money[0]?.paid_count ?? 0),
      },
      providers: {
        approved: providersByStatus['approved'] ?? 0,
        pending: providersByStatus['pending'] ?? 0,
      },
      customers,
      activeDistricts,
    };
  }
}
