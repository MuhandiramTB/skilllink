import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness/readiness probe for containers + monitoring (Month-5 brief Part 4).
   * Returns 200 with a structured payload: status, uptime, and per-dependency
   * checks. The DB check degrades gracefully (status='degraded') rather than
   * throwing, so an orchestrator can distinguish "process up, DB down".
   */
  @Get()
  async check() {
    const database = await this.checkDatabase();
    const mem = process.memoryUsage();
    return {
      status: database.ok ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks: {
        database,
        memory: {
          rss_mb: Math.round(mem.rss / 1024 / 1024),
          heapUsed_mb: Math.round(mem.heapUsed / 1024 / 1024),
        },
      },
    };
  }

  private async checkDatabase(): Promise<{ ok: boolean; postgis?: string; error?: string }> {
    try {
      const [{ postgis }] = await this.prisma.$queryRawUnsafe<{ postgis: string }[]>(
        `SELECT postgis_lib_version() AS postgis`,
      );
      return { ok: true, postgis };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
