import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { EnvelopeInterceptor } from './common/envelope.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { AppLogger, winstonLogger } from './common/logger';

/** Fail fast on misconfiguration before the server ever accepts a request. */
function assertProdConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  const problems: string[] = [];
  if (process.env.AUTH_VERIFIER !== 'firebase') {
    problems.push('AUTH_VERIFIER must be "firebase" in production (the mock is disabled).');
  }
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'dev-access-secret-change-me') {
    problems.push('JWT_ACCESS_SECRET must be set to a strong unique value.');
  }
  const cors = process.env.CORS_ORIGIN;
  if (!cors || cors === '*') {
    problems.push('CORS_ORIGIN must be an explicit origin (never "*") in production.');
  }
  if (problems.length) {
    throw new Error(`Refusing to start — insecure production config:\n - ${problems.join('\n - ')}`);
  }
}

async function bootstrap() {
  assertProdConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new AppLogger()); // structured JSON logs in prod

  // Security headers (OWASP baseline).
  app.use(helmet());

  // Body size limit. Work photos / verification docs are uploaded as base64 data
  // URLs (image.ts downscales to ~1200px). A 1200px JPEG data URL can be several
  // hundred KB, which blows past Express's ~100 KB default and makes uploads fail.
  // 12 MB comfortably covers a downscaled image (the client already caps raw files
  // at 5 MB, and base64 inflates by ~33%) without inviting oversized payloads.
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  // /api/v1 prefix (steering: tech.md)
  app.setGlobalPrefix('api/v1');

  // Validation at the edge (class-validator DTOs)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Standard envelope { data, error } on every response + error
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  winstonLogger.info(`SkillLink API listening on http://localhost:${port}/api/v1`, { context: 'Bootstrap' });
}
bootstrap();
