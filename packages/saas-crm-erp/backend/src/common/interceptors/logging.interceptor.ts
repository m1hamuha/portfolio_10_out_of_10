import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Skip logging for health checks
    if (url.includes('/health')) {
      return next.handle();
    }

    this.logger.log(
      `Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: (_data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.logger.log(
            `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
          );

          // Log slow requests
          if (duration > 1000) {
            this.logger.warn(
              `Slow Request: ${method} ${url} took ${duration}ms`,
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `Error: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
