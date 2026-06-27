import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { CreateDistrictDto } from './dto/district.dto';

// Kandy centre — default district point when admin doesn't pick one.
const KANDY = { lat: 7.2906, lng: 80.6350 };

@Injectable()
export class AdminDistrictsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** List districts with active state (Req 5.3). geography column omitted from select. */
  list() {
    return this.prisma.districts.findMany({
      select: { id: true, name_en: true, name_si: true, name_ta: true, is_active: true, launched_at: true },
      orderBy: [{ is_active: 'desc' }, { name_en: 'asc' }],
    });
  }

  /** Create a district. `center` is a NOT NULL geography column → set via raw SQL. */
  async create(actorId: string, dto: CreateDistrictDto) {
    const dup = await this.prisma.districts.findFirst({ where: { name_en: dto.name_en } });
    if (dup) {
      throw new ConflictException({ code: 'DISTRICT_EXISTS', message: 'errors.admin.districtExists' });
    }
    const lat = dto.lat ?? KANDY.lat;
    const lng = dto.lng ?? KANDY.lng;
    const active = dto.is_active ?? false;

    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO districts (name_en, name_si, name_ta, center, is_active, launched_at)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4,$5),4326)::geography, $6, $7)
       RETURNING id`,
      dto.name_en,
      dto.name_si,
      dto.name_ta,
      lng,
      lat,
      active,
      active ? new Date() : null,
    );
    const id = rows[0].id;
    await this.audit.record({ actorId, action: 'district.create', entity: 'districts', entityId: id, meta: { name_en: dto.name_en } });
    return this.prisma.districts.findUniqueOrThrow({
      where: { id },
      select: { id: true, name_en: true, name_si: true, name_ta: true, is_active: true, launched_at: true },
    });
  }

  /** Rename a district (trilingual). Geo centre unchanged. */
  async update(actorId: string, id: string, data: { name_en?: string; name_si?: string; name_ta?: string }) {
    const found = await this.prisma.districts.findUnique({ where: { id } });
    if (!found) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.admin.districtNotFound' });
    const row = await this.prisma.districts.update({
      where: { id },
      data: {
        ...(data.name_en !== undefined ? { name_en: data.name_en } : {}),
        ...(data.name_si !== undefined ? { name_si: data.name_si } : {}),
        ...(data.name_ta !== undefined ? { name_ta: data.name_ta } : {}),
      },
      select: { id: true, name_en: true, name_si: true, name_ta: true, is_active: true, launched_at: true },
    });
    await this.audit.record({ actorId, action: 'district.update', entity: 'districts', entityId: id, meta: { name_en: row.name_en } });
    return row;
  }

  /**
   * Hard delete — permanently removes the district. Guarded: refuses if any user,
   * provider, or booking references it (district_id FKs would break otherwise).
   */
  async remove(actorId: string, id: string) {
    const found = await this.prisma.districts.findUnique({ where: { id } });
    if (!found) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.admin.districtNotFound' });
    const [users, providers, bookings] = await Promise.all([
      this.prisma.users.count({ where: { district_id: id } }),
      this.prisma.providers.count({ where: { district_id: id } }),
      this.prisma.bookings.count({ where: { district_id: id } }),
    ]);
    if (users + providers + bookings > 0) {
      throw new ConflictException({ code: 'DISTRICT_IN_USE', message: 'errors.admin.districtInUse' });
    }
    await this.prisma.districts.delete({ where: { id } });
    await this.audit.record({ actorId, action: 'district.delete', entity: 'districts', entityId: id });
    return { id, deleted: true };
  }

  /** Activate / deactivate (Req 5.1, 5.2). Activating stamps launched_at. */
  async setActive(actorId: string, id: string, isActive: boolean) {
    const found = await this.prisma.districts.findUnique({ where: { id } });
    if (!found) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.admin.districtNotFound' });

    const row = await this.prisma.districts.update({
      where: { id },
      data: {
        is_active: isActive,
        launched_at: isActive ? (found.launched_at ?? new Date()) : found.launched_at,
      },
      select: { id: true, name_en: true, is_active: true, launched_at: true },
    });
    await this.audit.record({
      actorId,
      action: isActive ? 'district.activate' : 'district.deactivate',
      entity: 'districts',
      entityId: id,
    });
    return row;
  }
}
