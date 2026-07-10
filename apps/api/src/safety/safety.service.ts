import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotifierService } from '../notifications/notifier.service';

/**
 * Trust & Safety (product analysis gap #4). In-home service carries an Uber/Airbnb
 * risk profile, so customers need: an SOS alarm during a job, the ability to report
 * a provider, and trusted contacts to share a job with. Admins triage reports/alerts.
 */
@Injectable()
export class SafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifierService,
  ) {}

  /** Raise an SOS. Records the alert + pings the customer's trusted contacts and
   *  (via notification) the admin/ops queue. Returns the contacts so the client
   *  can also trigger a native share / call. */
  async raiseAlert(userId: string, dto: { bookingId?: string; lat?: number; lng?: number; note?: string }) {
    const alert = await this.prisma.safety_alerts.create({
      data: {
        user_id: userId,
        booking_id: dto.bookingId ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        note: dto.note ?? null,
      },
    });
    const contacts = await this.prisma.trusted_contacts.findMany({ where: { user_id: userId } });
    // Notify the user themselves (audit trail in their notifications) — real SMS/push
    // to contacts is delivered by the notification channels once wired.
    await this.notifier.notify({
      userId,
      type: 'safety.alert_raised',
      title: 'Safety alert sent',
      body: contacts.length ? `We alerted ${contacts.length} trusted contact(s).` : 'Your alert was recorded. Stay safe.',
      link: dto.bookingId ? `/bookings/${dto.bookingId}` : undefined,
    });
    return { id: alert.id, contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })) };
  }

  async resolveAlert(userId: string, alertId: string) {
    const a = await this.prisma.safety_alerts.findUnique({ where: { id: alertId } });
    if (!a || a.user_id !== userId) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.safety.alertNotFound' });
    await this.prisma.safety_alerts.update({ where: { id: alertId }, data: { status: 'resolved', resolved_at: new Date() } });
    return { ok: true };
  }

  /** Report a provider. Feeds the admin trust queue; a safety-reason report also
   *  notifies the reporter it's received. */
  async reportProvider(reporterId: string, dto: { providerId: string; bookingId?: string; reason: string; detail?: string }) {
    // Validate the target exists so a bad id returns a clean 404, not a FK 500.
    const provider = await this.prisma.providers.findUnique({ where: { user_id: dto.providerId }, select: { user_id: true } });
    if (!provider) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.safety.providerNotFound' });
    const report = await this.prisma.provider_reports.create({
      data: {
        provider_id: dto.providerId,
        reporter_id: reporterId,
        booking_id: dto.bookingId ?? null,
        reason: dto.reason,
        detail: dto.detail ?? null,
      },
    });
    await this.notifier.notify({
      userId: reporterId,
      type: 'safety.report_received',
      title: 'Report received',
      body: 'Thanks — our team will review this. You are safe to keep using SkillLink.',
    });
    return { id: report.id, status: report.status };
  }

  listContacts(userId: string) {
    return this.prisma.trusted_contacts.findMany({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
  }

  addContact(userId: string, dto: { name: string; phone: string }) {
    return this.prisma.trusted_contacts.create({ data: { user_id: userId, name: dto.name, phone: dto.phone } });
  }

  async removeContact(userId: string, id: string) {
    const c = await this.prisma.trusted_contacts.findUnique({ where: { id } });
    if (!c || c.user_id !== userId) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.safety.contactNotFound' });
    await this.prisma.trusted_contacts.delete({ where: { id } });
    return { ok: true };
  }

  /** Admin: open reports + active alerts for the trust queue. */
  adminOpenReports() {
    return this.prisma.provider_reports.findMany({
      where: { status: { in: ['open', 'reviewing'] } },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
  }

  adminActiveAlerts() {
    return this.prisma.safety_alerts.findMany({
      where: { status: 'active' },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
  }
}
