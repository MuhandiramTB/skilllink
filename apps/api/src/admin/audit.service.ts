import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Writes an audit_log row for every admin mutation (Spec 06 NFR). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    actorId: string;
    action: string;
    entity: string;
    entityId?: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.audit_log.create({
      data: {
        actor_id: params.actorId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId ?? null,
        meta: (params.meta ?? {}) as object,
      },
    });
  }
}
