import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    // Confirms DB connectivity + PostGIS is present.
    const [{ postgis }] = await this.prisma.$queryRawUnsafe<{ postgis: string }[]>(
      `SELECT postgis_lib_version() AS postgis`,
    );
    return { status: 'ok', postgis };
  }
}
