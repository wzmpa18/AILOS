import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  code: number;
  message: string;
  data: T;
  ai_generated: boolean;
  timestamp: number;
  request_id: string;
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data: any) => ({
        code: 0,
        message: 'success',
        data: data ?? null,
        ai_generated: data?.ai_generated ?? false,
        timestamp: Date.now(),
        request_id: request.headers['x-request-id'] || '',
      })),
    );
  }
}
