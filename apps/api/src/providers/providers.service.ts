import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddVerificationDto,
  BecomeProviderDto,
  ServiceAreaDto,
} from './dto/provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Req 1.3: become a provider (idempotent). Customer → provider, status=pending. */
  async become(userId: string, dto: BecomeProviderDto) {
    const existing = await this.prisma.providers.findUnique({ where: { user_id: userId } });
    if (existing) return this.meSummary(userId); // idempotent

    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });
    if (user.role === 'admin') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.providers.adminCannotBecome' });
    }

    // Multi-role model: presence of the providers row IS the provider role. We do
    // NOT flip users.role (it now only flags admin) — the account keeps its customer
    // role and gains provider, so the same login acts as both.
    await this.prisma.providers.create({
      data: {
        user_id: userId,
        business_name: dto.businessName ?? null,
        status: 'pending',
        district_id: user.district_id,
        is_available: false,
      },
    });
    return this.meSummary(userId);
  }

  /** Req 1.1/1.2: add a verification document (pending). */
  async addVerification(userId: string, dto: AddVerificationDto) {
    await this.ensureProvider(userId);
    const row = await this.prisma.verifications.create({
      data: { provider_id: userId, type: dto.type, media_url: dto.mediaUrl, status: 'pending' },
    });
    return { id: row.id, type: row.type, status: row.status };
  }

  /** Req 2.1: set service area (PostGIS point) via raw SQL. */
  async setServiceArea(userId: string, dto: ServiceAreaDto) {
    await this.ensureProvider(userId);
    // one area per provider for v1: replace existing
    await this.prisma.service_areas.deleteMany({ where: { provider_id: userId } });
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO service_areas (provider_id, center, radius_meters)
       VALUES ($1::uuid, ST_SetSRID(ST_MakePoint($2,$3),4326)::geography, $4)`,
      userId,
      dto.lng,
      dto.lat,
      dto.radiusMeters,
    );
    // also set provider base_location to the same point (used by matching)
    await this.prisma.$executeRawUnsafe(
      `UPDATE providers SET base_location = ST_SetSRID(ST_MakePoint($2,$3),4326)::geography, updated_at = now()
       WHERE user_id = $1::uuid`,
      userId,
      dto.lng,
      dto.lat,
    );
    return { ok: true };
  }

  /** Req 2.2: set categories (validate exist + active). */
  async setCategories(userId: string, categoryIds: string[]) {
    await this.ensureProvider(userId);
    const found = await this.prisma.categories.findMany({
      where: { id: { in: categoryIds }, is_active: true },
      select: { id: true },
    });
    if (found.length !== categoryIds.length) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.providers.categoryInvalid' });
    }
    await this.prisma.provider_categories.deleteMany({ where: { provider_id: userId } });
    await this.prisma.provider_categories.createMany({
      data: categoryIds.map((category_id) => ({ provider_id: userId, category_id })),
    });
    return { count: categoryIds.length };
  }

  /** Provider details (spec 10): experience + availability schedule. */
  async setDetails(
    userId: string,
    d: { yearsExperience?: number; workingDays?: string; workingHours?: string; emergencyService?: boolean },
  ) {
    await this.ensureProvider(userId);
    await this.prisma.providers.update({
      where: { user_id: userId },
      data: {
        years_experience: d.yearsExperience ?? null,
        working_days: d.workingDays ?? null,
        working_hours: d.workingHours ?? null,
        emergency_service: d.emergencyService ?? false,
        updated_at: new Date(),
      },
    });
    return { ok: true };
  }

  /** Req 3.1: availability toggle. */
  async setAvailability(userId: string, isAvailable: boolean) {
    await this.ensureProvider(userId);
    await this.prisma.providers.update({
      where: { user_id: userId },
      data: { is_available: isAvailable, updated_at: new Date() },
    });
    return { isAvailable };
  }

  /** Provider's own profile + verification status. */
  async meSummary(userId: string) {
    const p = await this.prisma.providers.findUnique({
      where: { user_id: userId },
      include: { verifications: { select: { type: true, status: true } }, provider_categories: true },
    });
    if (!p) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.providers.notFound' });
    return {
      status: p.status,
      businessName: p.business_name,
      isAvailable: p.is_available,
      ratingAvg: Number(p.rating_avg),
      categories: p.provider_categories.length,
      verifications: p.verifications,
    };
  }

  /** Req 4 (trust): public profile — no PII, exposes verified flag. */
  async publicProfile(providerId: string) {
    const p = await this.prisma.providers.findUnique({ where: { user_id: providerId } });
    if (!p) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.providers.notFound' });
    return {
      id: p.user_id,
      businessName: p.business_name,
      ratingAvg: Number(p.rating_avg),
      ratingCount: p.rating_count,
      verified: p.status === 'approved',
    };
  }

  private async ensureProvider(userId: string) {
    const p = await this.prisma.providers.findUnique({ where: { user_id: userId } });
    if (!p) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.providers.notProvider' });
  }
}
