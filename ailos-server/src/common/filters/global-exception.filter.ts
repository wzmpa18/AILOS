import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let code = 9000;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      if (status === 400) code = 1001;
      else if (status === 401) code = 1002;
      else if (status === 403) code = 1003;
      else if (status === 404) code = 1004;
      else if (status === 429) code = 3003;
      else code = 9000;
    }

    this.logger.error(`[${request.method}] ${request.url} -> ${status} ${message}`);

    response.status(status).json({
      code,
      message,
      data: null,
      ai_generated: false,
      timestamp: Date.now(),
      request_id: request.headers['x-request-id'] || '',
    });
  }
}
