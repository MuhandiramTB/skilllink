import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
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
