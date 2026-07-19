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
      select: {
        user_id: true, business_name: true, status: true,
        rating_avg: true, rating_count: true, years_experience: true,
        working_days: true, working_hours: true, emergency_service: true,
        user: {
          select: {
            phone: true, created_at: true,
            customer_profile: { select: { full_name: true, email: true } },
            district: { select: { name_en: true } },
          },
        },
        provider_categories: { select: { category: { select: { name_en: true } } } },
      },
    });
    return providers.map((p) => ({
      providerId: p.user_id,
      businessName: p.business_name,
      status: p.status,
      // full details for the admin to review the application
      fullName: p.user?.customer_profile?.full_name ?? null,
      phone: p.user?.phone ?? null,
      email: p.user?.customer_profile?.email ?? null,
      district: p.user?.district?.name_en ?? null,
      ratingAvg: Number(p.rating_avg ?? 0),
      ratingCount: p.rating_count,
      yearsExperience: p.years_experience,
      workingDays: p.working_days,
      workingHours: p.working_hours,
      emergencyService: p.emergency_service,
      categories: p.provider_categories.map((pc) => pc.category.name_en),
      appliedAt: p.user?.created_at ?? null,
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
      // On approval, also make the provider AVAILABLE by default. Otherwise an
      // approved provider stays invisible in search/matching (which requires
      // is_available=true) until they manually "go online" — a confusing gap where
      // admins approve someone but customers still can't find them. They can toggle
      // off anytime from their dashboard.
      this.prisma.providers.update({
        where: { user_id: providerId },
        data: decision === 'approve' ? { status: newStatus, is_available: true } : { status: newStatus },
      }),
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
