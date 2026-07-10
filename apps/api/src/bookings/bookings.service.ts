import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { NotifierService } from '../notifications/notifier.service';
import { canTransition, BookingStatus } from './booking-status';
import { CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
    private readonly notifier: NotifierService,
  ) {}

  /** Req 1: create a booking (status=requested). Location via PostGIS raw SQL. */
  async create(customerId: string, dto: CreateBookingDto) {
    const category = await this.prisma.categories.findUnique({ where: { key: dto.categoryKey } });
    if (!category || !category.is_active) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.booking.categoryInvalid' });
    }
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: customerId } });

    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO bookings (customer_id, category_id, district_id, description, location, status, solar_specs, scheduled_for, address_text, address_notes)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, ST_SetSRID(ST_MakePoint($5,$6),4326)::geography, 'requested', $7::jsonb, $8::timestamptz, $9, $10)
       RETURNING id`,
      customerId,
      category.id,
      user.district_id,
      dto.description ?? null,
      dto.lng,
      dto.lat,
      dto.solarSpecs ? JSON.stringify(dto.solarSpecs) : null,
      dto.scheduledFor ?? null,
      dto.addressText ?? null,
      dto.addressNotes ?? null,
    );
    const bookingId = rows[0].id;

    if (dto.media?.length) {
      await this.prisma.booking_media.createMany({
        data: dto.media.map((m) => ({ booking_id: bookingId, kind: m.kind, url: m.url })),
      });
    }
    return this.detail(customerId, bookingId);
  }

  /** Req 2: ranked verified providers for this booking (reuses matching engine). */
  async matches(customerId: string, bookingId: string) {
    const b = await this.ownedByCustomer(customerId, bookingId);
    const cat = await this.prisma.categories.findUniqueOrThrow({ where: { id: b.category_id } });
    const pt = await this.bookingPoint(bookingId);
    const results = await this.matching.match({ categoryKey: cat.key, lat: pt.lat, lng: pt.lng });
    return { results, note: results.length === 0 ? 'MATCH_NONE_IN_RADIUS' : null };
  }

  /** Req 2.3: assign a provider → matched. Atomic: the status guard is part of the
   *  UPDATE, so two concurrent assigns can't both win (the second matches 0 rows). */
  async assign(customerId: string, bookingId: string, providerId: string) {
    const b = await this.ownedByCustomer(customerId, bookingId);
    this.assertTransition(b.status as BookingStatus, 'matched');
    const provider = await this.prisma.providers.findUnique({ where: { user_id: providerId } });
    if (!provider || provider.status !== 'approved') {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.booking.providerNotApproved' });
    }
    // Conditional update: only transitions from the status we validated. If another
    // request already moved it, count===0 and we surface a clean conflict.
    const updated = await this.prisma.bookings.updateMany({
      where: { id: bookingId, status: b.status },
      data: { status: 'matched', provider_id: providerId, updated_at: new Date() },
    });
    if (updated.count === 0) {
      throw new BadRequestException({ code: 'BOOKING_INVALID_TRANSITION', message: 'errors.booking.invalidTransition' });
    }
    await this.notifier.notify({
      userId: providerId, type: 'booking.requested',
      title: 'New job request', body: 'A customer wants to book you.', link: `/bookings/${bookingId}`,
    });
    return { id: bookingId, status: 'matched' as BookingStatus };
  }

  /** Req 3: provider accept/reject. */
  async respond(providerId: string, bookingId: string, action: 'accept' | 'reject') {
    const b = await this.assignedToProvider(providerId, bookingId);
    if (action === 'accept') {
      this.assertTransition(b.status as BookingStatus, 'accepted');
      const now = new Date();
      const res = await this.setStatus(bookingId, 'accepted', { accepted_at: now });
      // Spec 13: feed the matching engine's responsiveness signal — roll the
      // provider's avg_response_seconds toward this job's accept latency.
      await this.recordResponseTime(providerId, Math.max(0, Math.round((now.getTime() - new Date(b.created_at).getTime()) / 1000)));
      await this.notifier.notify({
        userId: b.customer_id, type: 'booking.accepted',
        title: 'Provider accepted', body: 'Your provider accepted the job.', link: `/bookings/${bookingId}`,
      });
      return res;
    }
    // reject → back to requested, unassign
    this.assertTransition(b.status as BookingStatus, 'requested');
    const res = await this.setStatus(bookingId, 'requested', { provider_id: null });
    await this.notifier.notify({
      userId: b.customer_id, type: 'booking.rejected',
      title: 'Provider unavailable', body: 'Please choose another provider.', link: `/bookings/${bookingId}`,
    });
    return res;
  }

  /** Req 5.1: provider advances status (in_progress/completed). */
  async updateStatus(providerId: string, bookingId: string, status: 'in_progress' | 'completed') {
    const b = await this.assignedToProvider(providerId, bookingId);
    this.assertTransition(b.status as BookingStatus, status);
    // Spec 11 Req 2.4: a provider may only start a job once the quote is accepted.
    if (status === 'in_progress' && b.quote_status !== 'accepted') {
      throw new BadRequestException({ code: 'QUOTE_NOT_ACCEPTED', message: 'errors.booking.quoteNotAccepted' });
    }
    const res = await this.setStatus(bookingId, status);
    if (status === 'completed') {
      await this.notifier.notify({
        userId: b.customer_id, type: 'booking.completed',
        title: 'Job completed', body: 'Pay and leave a review.', link: `/bookings/${bookingId}`,
      });
    }
    return res;
  }

  /** Spec 11 Req 1: provider sets/updates a quote (status matched|accepted). */
  async setQuote(providerId: string, bookingId: string, amountCents: number) {
    const b = await this.assignedToProvider(providerId, bookingId);
    if (b.status !== 'matched' && b.status !== 'accepted') {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.booking.quoteNotAllowed' });
    }
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { price_cents: amountCents, quote_status: 'quoted', updated_at: new Date() },
    });
    // Notify the customer that a price quote is ready to review.
    await this.notifier.notify({
      userId: b.customer_id, type: 'booking.quoted',
      title: 'Price quote ready', body: 'Your provider sent a price. Tap to accept.', link: `/bookings/${bookingId}`,
    });
    return { id: bookingId, priceCents: amountCents, quoteStatus: 'quoted' };
  }

  /** Spec 11 Req 2: customer accepts a quoted booking they own. */
  async acceptQuote(customerId: string, bookingId: string) {
    const b = await this.ownedByCustomer(customerId, bookingId);
    if (b.quote_status !== 'quoted') {
      throw new BadRequestException({ code: 'NO_QUOTE', message: 'errors.booking.noQuote' });
    }
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { quote_status: 'accepted', updated_at: new Date() },
    });
    return { id: bookingId, quoteStatus: 'accepted' };
  }

  /**
   * Cancellation policy (product analysis gap: fair cancellation). Cancelling
   * BEFORE the provider has accepted is always free. Cancelling an ACCEPTED job
   * charges a cancellation fee (a % of the quoted price, capped) — this protects
   * the provider's reserved time and discourages abuse. The fee is recorded on the
   * booking (settled with the provider's next payout / the wallet). `by` marks who
   * cancelled for audit + fairness (a provider-initiated cancel is never charged to
   * the customer).
   */
  async cancel(customerId: string, bookingId: string, reason?: string) {
    const b = await this.ownedByCustomer(customerId, bookingId);
    this.assertTransition(b.status as BookingStatus, 'cancelled');
    // Fee only when a provider had committed (accepted). 15% of quote, capped LKR 500.
    const chargeable = b.status === 'accepted';
    const feeCents = chargeable && b.price_cents ? Math.min(50000, Math.round(b.price_cents * 0.15)) : 0;
    const res = await this.setStatus(bookingId, 'cancelled', {
      cancelled_by: 'customer',
      cancel_reason: reason ?? null,
      cancelled_at: new Date(),
      cancel_fee_cents: feeCents,
    });
    if (b.provider_id) {
      await this.notifier.notify({
        userId: b.provider_id, type: 'booking.cancelled',
        title: 'Booking cancelled', body: 'The customer cancelled this job.', link: `/bookings/${bookingId}`,
      });
    }
    return { ...res, cancelFeeCents: feeCents };
  }

  /**
   * Report a provider no-show (customer-initiated). Terminal state; the provider
   * takes a strike (repeated strikes → admin review / suspension) and the customer
   * owes nothing. A strong deterrent for the "provider no-show kills the customer"
   * failure mode.
   */
  async markNoShow(customerId: string, bookingId: string) {
    const b = await this.ownedByCustomer(customerId, bookingId);
    this.assertTransition(b.status as BookingStatus, 'no_show');
    const res = await this.setStatus(bookingId, 'no_show', {
      cancelled_by: 'customer',
      cancel_reason: 'provider_no_show',
      cancelled_at: new Date(),
    });
    if (b.provider_id) {
      await this.prisma.providers.update({
        where: { user_id: b.provider_id },
        data: { strikes: { increment: 1 }, updated_at: new Date() },
      });
      await this.notifier.notify({
        userId: b.provider_id, type: 'booking.no_show',
        title: 'No-show recorded', body: 'A customer reported you did not arrive. Repeated no-shows affect your standing.', link: `/bookings/${bookingId}`,
      });
    }
    return res;
  }

  /**
   * Live tracking: the assigned provider posts their current location (+ optional
   * ETA) while en route. Only allowed on an accepted/in_progress job they own.
   * Stores the latest point on the booking; the customer polls the detail to see it.
   */
  async updateLiveLocation(providerId: string, bookingId: string, lat: number, lng: number, etaMinutes?: number) {
    const b = await this.assignedToProvider(providerId, bookingId);
    if (!['accepted', 'in_progress'].includes(b.status)) {
      throw new BadRequestException({ code: 'NOT_EN_ROUTE', message: 'errors.booking.notEnRoute' });
    }
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { provider_lat: lat, provider_lng: lng, provider_loc_at: new Date(), provider_eta_minutes: etaMinutes ?? null, updated_at: new Date() },
    });
    return { ok: true };
  }

  /**
   * Disintermediation defense (product analysis gap #3): a provider self-reports a
   * job they settled in CASH off the booking flow, so commission is still owed and
   * the job counts toward their on-platform record. Honesty is incentivised
   * elsewhere (rewards + rating weight); here we record it + flag commission.
   */
  async reportCashJob(providerId: string, bookingId: string) {
    const b = await this.assignedToProvider(providerId, bookingId);
    if (b.cash_reported) {
      throw new BadRequestException({ code: 'ALREADY_REPORTED', message: 'errors.booking.cashAlreadyReported' });
    }
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { cash_reported: true, cash_reported_at: new Date(), updated_at: new Date() },
    });
    await this.notifier.notify({
      userId: providerId, type: 'booking.cash_reported',
      title: 'Cash job recorded', body: 'Thanks for keeping it honest — this counts toward your record.', link: `/bookings/${bookingId}`,
    });
    return { ok: true };
  }

  async history(userId: string, role: 'customer' | 'provider') {
    const where = role === 'provider' ? { provider_id: userId } : { customer_id: userId };
    const rows = await this.prisma.bookings.findMany({
      where,
      select: { id: true, status: true, category_id: true, description: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return this.withCategoryKeys(rows);
  }

  /** Provider jobs inbox: bookings assigned to this provider, newest first. */
  async providerJobs(providerId: string) {
    const rows = await this.prisma.bookings.findMany({
      where: { provider_id: providerId },
      select: { id: true, status: true, category_id: true, description: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return this.withCategoryKeys(rows);
  }

  /** Attach human-readable category key to a list of bookings. */
  private async withCategoryKeys<T extends { category_id: string }>(rows: T[]) {
    const ids = [...new Set(rows.map((r) => r.category_id))];
    const cats = await this.prisma.categories.findMany({
      where: { id: { in: ids } },
      select: { id: true, key: true },
    });
    const keyById = new Map(cats.map((c) => [c.id, c.key]));
    return rows.map((r) => ({ ...r, categoryKey: keyById.get(r.category_id) ?? null }));
  }

  async detail(userId: string, bookingId: string) {
    const b = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { booking_media: { select: { kind: true, url: true } } },
    });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.booking.notFound' });
    if (b.customer_id !== userId && b.provider_id !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.booking.notYours' });
    }
    // Destination coords (the service location) — needed for the live-tracking map.
    const dest = await this.bookingPoint(bookingId).catch(() => null);
    return {
      id: b.id,
      status: b.status,
      destLat: dest?.lat ?? null,
      destLng: dest?.lng ?? null,
      categoryId: b.category_id,
      description: b.description,
      providerId: b.provider_id,
      quoteStatus: b.quote_status, // none | quoted | accepted
      priceCents: b.price_cents,
      solarSpecs: b.solar_specs,
      media: b.booking_media,
      createdAt: b.created_at,
      acceptedAt: b.accepted_at,
      startedAt: b.started_at,
      completedAt: b.completed_at,
      scheduledFor: b.scheduled_for,
      addressText: b.address_text,
      addressNotes: b.address_notes,
      // Live tracking: latest provider point + ETA (null until en route / posted).
      providerLat: b.provider_lat,
      providerLng: b.provider_lng,
      providerLocAt: b.provider_loc_at,
      providerEtaMinutes: b.provider_eta_minutes,
    };
  }

  /**
   * Spec 17: reschedule — set a new preferred date/time. Either the customer who
   * owns it or the assigned provider may reschedule, only before the job starts
   * (requested/matched/accepted). Notifies the other party.
   */
  async reschedule(userId: string, bookingId: string, scheduledFor: string) {
    const b = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.booking.notFound' });
    const isCustomer = b.customer_id === userId;
    const isProvider = b.provider_id === userId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.booking.notYours' });
    }
    if (!['requested', 'matched', 'accepted'].includes(b.status)) {
      throw new BadRequestException({ code: 'BOOKING_INVALID_TRANSITION', message: 'errors.booking.rescheduleNotAllowed' });
    }
    const when = new Date(scheduledFor);
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { scheduled_for: when, updated_at: new Date() },
    });
    // Tell the other party a new time was proposed.
    const notifyUser = isCustomer ? b.provider_id : b.customer_id;
    if (notifyUser) {
      await this.notifier.notify({
        userId: notifyUser, type: 'booking.rescheduled',
        title: 'Booking rescheduled', body: 'A new time was proposed for a booking.', link: `/bookings/${bookingId}`,
      });
    }
    return { id: bookingId, scheduledFor: when };
  }

  // ---- helpers ----
  private async setStatus(bookingId: string, status: BookingStatus, extra: Record<string, unknown> = {}) {
    const now = new Date();
    // Spec 13: stamp the lifecycle timestamp matching the new status (unless the
    // caller already set it). Only set on the forward transition into each state.
    const stamp: Record<string, unknown> = {};
    if (status === 'in_progress') stamp.started_at = now;
    if (status === 'completed') stamp.completed_at = now;
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { status, updated_at: now, ...stamp, ...extra },
    });
    return { id: bookingId, status };
  }

  /**
   * Spec 13: update a provider's rolling average accept-response time. Uses an
   * exponential moving average (alpha=0.3) so recent behaviour dominates without
   * needing to store every sample. avg=0 (never measured) seeds with the first value.
   */
  private async recordResponseTime(providerId: string, seconds: number) {
    const p = await this.prisma.providers.findUnique({
      where: { user_id: providerId },
      select: { avg_response_seconds: true },
    });
    if (!p) return;
    const prev = p.avg_response_seconds ?? 0;
    const next = prev === 0 ? seconds : Math.round(prev * 0.7 + seconds * 0.3);
    await this.prisma.providers.update({
      where: { user_id: providerId },
      data: { avg_response_seconds: next, updated_at: new Date() },
    });
  }

  private assertTransition(from: BookingStatus, to: BookingStatus) {
    if (!canTransition(from, to)) {
      throw new BadRequestException({ code: 'BOOKING_INVALID_TRANSITION', message: 'errors.booking.invalidTransition' });
    }
  }

  private async ownedByCustomer(customerId: string, bookingId: string) {
    const b = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.booking.notFound' });
    if (b.customer_id !== customerId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.booking.notYours' });
    }
    return b;
  }

  private async assignedToProvider(providerId: string, bookingId: string) {
    const b = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.booking.notFound' });
    if (b.provider_id !== providerId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.booking.notAssigned' });
    }
    return b;
  }

  private async bookingPoint(bookingId: string): Promise<{ lat: number; lng: number }> {
    const rows = await this.prisma.$queryRawUnsafe<{ lat: number; lng: number }[]>(
      `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM bookings WHERE id = $1::uuid`,
      bookingId,
    );
    return rows[0];
  }
}
