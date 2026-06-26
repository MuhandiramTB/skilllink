import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

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
