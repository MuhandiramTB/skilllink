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
      `INSERT INTO bookings (customer_id, category_id, district_id, description, location, status, solar_specs)
       VALUES ($1::uuid, $2::uuid, $3, $4, ST_SetSRID(ST_MakePoint($5,$6),4326)::geography, 'requested', $7::jsonb)
       RETURNING id`,
      customerId,
      category.id,
      user.district_id,
      dto.description ?? null,
      dto.lng,
      dto.lat,
      dto.solarSpecs ? JSON.stringify(dto.solarSpecs) : null,
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
      const res = await this.setStatus(bookingId, 'accepted');
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

  /** Req 5.2: customer cancels (from requested/matched/accepted). */
  async cancel(customerId: string, bookingId: string) {
    const b = await this.ownedByCustomer(customerId, bookingId);
    this.assertTransition(b.status as BookingStatus, 'cancelled');
    return this.setStatus(bookingId, 'cancelled');
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
    return {
      id: b.id,
      status: b.status,
      categoryId: b.category_id,
      description: b.description,
      providerId: b.provider_id,
      quoteStatus: b.quote_status, // none | quoted | accepted
      priceCents: b.price_cents,
      solarSpecs: b.solar_specs,
      media: b.booking_media,
      createdAt: b.created_at,
    };
  }

  // ---- helpers ----
  private async setStatus(bookingId: string, status: BookingStatus, extra: Record<string, unknown> = {}) {
    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { status, updated_at: new Date(), ...extra },
    });
    return { id: bookingId, status };
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
