import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Renders all errors in the standard envelope:
 *   { "data": null, "error": { "code": <CODE>, "message": <i18n key or text> } }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'errors.internal';

    if (!(exception instanceof HttpException)) {
      // Unexpected error — log full detail (never leak to client).
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as
        | string
        | { message?: string | string[]; code?: string };
      if (typeof body === 'string') {
        message = body;
      } else {
        code = body.code ?? code;
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ?? message;
      }
      if (code === 'INTERNAL_ERROR') code = mapStatusToCode(status);
    }

    res.status(status).json({ data: null, error: { code, message } });
  }
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMIT';
    default:
      return 'INTERNAL_ERROR';
  }
}
