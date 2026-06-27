import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** List all categories incl. inactive (admin view). */
  list() {
    return this.prisma.categories.findMany({ orderBy: { sort_order: 'asc' } });
  }

  /** Create a category or sub-category (Req 2.1, 2.5, 3). */
  async create(actorId: string, dto: CreateCategoryDto) {
    // unique key (Req 2.3)
    const dup = await this.prisma.categories.findUnique({ where: { key: dto.key } });
    if (dup) {
      throw new ConflictException({ code: 'CATEGORY_KEY_EXISTS', message: 'errors.admin.categoryKeyExists' });
    }

    // parent must exist and be top-level (depth <= 2) (Req 3.2, 3.3)
    if (dto.parent_id) {
      const parent = await this.prisma.categories.findUnique({ where: { id: dto.parent_id } });
      if (!parent) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.admin.parentNotFound' });
      }
      if (parent.parent_id) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'errors.admin.depthExceeded' });
      }
    }

    const row = await this.prisma.categories.create({
      data: {
        key: dto.key,
        name_en: dto.name_en,
        name_si: dto.name_si,
        name_ta: dto.name_ta,
        parent_id: dto.parent_id ?? null,
        sort_order: dto.sort_order ?? 0,
      },
    });
    await this.audit.record({ actorId, action: 'category.create', entity: 'categories', entityId: row.id, meta: { key: row.key } });
    return row;
  }

  /** Update names / active / sort_order (Req 2.2, 4.1). */
  async update(actorId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    const row = await this.prisma.categories.update({ where: { id }, data: { ...dto } });
    await this.audit.record({ actorId, action: 'category.update', entity: 'categories', entityId: id, meta: { ...dto } });
    return row;
  }

  /** Soft-deactivate → hidden from public tree (Req 2.4). */
  async deactivate(actorId: string, id: string) {
    await this.ensureExists(id);
    const row = await this.prisma.categories.update({ where: { id }, data: { is_active: false } });
    await this.audit.record({ actorId, action: 'category.deactivate', entity: 'categories', entityId: id });
    return row;
  }

  /**
   * Hard delete — permanently removes the row. Guarded: refuses if the category has
   * sub-services or is referenced by any booking (would orphan/break data).
   * provider_categories cascade automatically, so those don't block.
   */
  async remove(actorId: string, id: string) {
    await this.ensureExists(id);
    const children = await this.prisma.categories.count({ where: { parent_id: id } });
    if (children > 0) {
      throw new ConflictException({ code: 'CATEGORY_HAS_CHILDREN', message: 'errors.admin.categoryHasChildren' });
    }
    const bookings = await this.prisma.bookings.count({ where: { category_id: id } });
    if (bookings > 0) {
      throw new ConflictException({ code: 'CATEGORY_IN_USE', message: 'errors.admin.categoryInUse' });
    }
    await this.prisma.categories.delete({ where: { id } });
    await this.audit.record({ actorId, action: 'category.delete', entity: 'categories', entityId: id });
    return { id, deleted: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.categories.findUnique({ where: { id } });
    if (!found) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.admin.categoryNotFound' });
  }
}
