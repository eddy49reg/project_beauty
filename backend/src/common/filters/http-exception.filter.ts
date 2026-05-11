import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const normalized = this.normalizePayload(payload);
      response.status(status).json({
        ok: false,
        statusCode: status,
        error: HttpStatus[status] ?? 'Error',
        ...normalized,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ok: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizePayload(payload: string | object) {
    if (typeof payload === 'string') {
      return { message: payload };
    }
    const data = payload as Record<string, unknown>;
    const message = data.message;
    if (Array.isArray(message)) {
      return { message: message.join('; '), details: message };
    }
    if (typeof message === 'string') {
      return { message };
    }
    return { message: 'Ошибка обработки запроса' };
  }
}
