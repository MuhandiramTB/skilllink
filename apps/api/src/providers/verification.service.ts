import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../admin/audit.service';
import { NotifierService } from '../notifications/notifier.service';

/** Admin-side verification queue + approve/reject (Spec Req 4). */
@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifier: NotifierService,
  ) {}

  /** Req 4: list providers with pending verifications. */
  async queue() {
    const pending = await this.prisma.verifications.findMany({
      where: { status: 'pending' },
      select: { id: true, provider_id: true, type: true, media_url: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
    // group by provider
    const byProvider = new Map<string, typeof pending>();
    pending.forEach((v) => {
      const list = byProvider.get(v.provider_id) ?? [];
      list.push(v);
      byProvider.set(v.provider_id, list);
    });
    const providerIds = [...byProvider.keys()];
    const providers = await this.prisma.providers.findMany({
      where: { user_id: { in: providerIds } },
      select: { user_id: true, business_name: true, status: true },
    });
    return providers.map((p) => ({
      providerId: p.user_id,
      businessName: p.business_name,
      status: p.status,
      documents: byProvider.get(p.user_id) ?? [],
    }));
  }

  /** Req 4.1/4.2: approve or reject a provider's verification. */
  async decide(adminId: string, providerId: string, decision: 'approve' | 'reject', reason?: string) {
    const provider = await this.prisma.providers.findUnique({ where: { user_id: providerId } });
    if (!provider) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.providers.notFound' });

    const newStatus = decision === 'approve' ? 'approved' : 'rejected';
    const vStatus = decision === 'approve' ? 'approved' : 'rejected';

    await this.prisma.$transaction([
      this.prisma.providers.update({ where: { user_id: providerId }, data: { status: newStatus } }),
      this.prisma.verifications.updateMany({
        where: { provider_id: providerId, status: 'pending' },
        data: { status: vStatus, reviewed_by: adminId, reason: reason ?? null, reviewed_at: new Date() },
      }),
    ]);
    await this.audit.record({
      actorId: adminId,
      action: `provider.${decision}`,
      entity: 'providers',
      entityId: providerId,
      meta: { reason: reason ?? null },
    });
    await this.notifier.notify({
      userId: providerId,
      type: `provider.${decision}d`,
      title: decision === 'approve' ? 'You are verified' : 'Verification rejected',
      body: decision === 'approve' ? 'You can now receive jobs.' : (reason ?? 'Please review your documents.'),
      link: '/provider',
    });
    return { providerId, status: newStatus };
  }
}
