import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      // Fail loud and fast: a server that started without its DB serves only errors.
      this.logger.error('Failed to connect to the database on startup', err as Error);
      throw err;
    }
  }

  async onModuleDestroy() {
    // Flush in-flight queries before the process exits (graceful SIGTERM on deploy).
    await this.$disconnect();
  }
}
