import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Structured JSON logger (Month-5 brief Part 4). JSON logs are queryable by log
 * aggregators (Render logs, CloudWatch, Loki, etc.). In dev we keep it readable;
 * in production we emit JSON + write error/combined files. Implements Nest's
 * LoggerService so it replaces the default logger app-wide via app.useLogger().
 */
const isProd = process.env.NODE_ENV === 'production';

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf((i) => `${i.timestamp} ${i.level} ${String(i.context ?? '')} ${i.message}`),
      ),
  transports: [
    new winston.transports.Console(),
    // File transports only in prod (containers/hosts collect stdout in dev).
    ...(isProd
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

export class AppLogger implements LoggerService {
  log(message: unknown, context?: string) { winstonLogger.info(this.s(message), { context }); }
  error(message: unknown, trace?: string, context?: string) { winstonLogger.error(this.s(message), { context, trace }); }
  warn(message: unknown, context?: string) { winstonLogger.warn(this.s(message), { context }); }
  debug(message: unknown, context?: string) { winstonLogger.debug(this.s(message), { context }); }
  verbose(message: unknown, context?: string) { winstonLogger.verbose(this.s(message), { context }); }
  private s(m: unknown): string { return typeof m === 'string' ? m : JSON.stringify(m); }
}

export { winstonLogger };
