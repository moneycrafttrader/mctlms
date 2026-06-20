/*
 * Global response interceptor — wraps every successful response in a consistent envelope
 *
 * Why this interceptor exists:
 *   - Ensures every API response has the same shape: { success: true, data, timestamp }.
 *   - The frontend can always destructure `response.data` without worrying about
 *     whether the backend returned a raw array, object, or paginated result.
 *   - Pairs with HttpExceptionFilter which handles the error side (success: false).
 *
 * A junior should know:
 *   - This is registered globally — no @UseInterceptors() needed.
 *   - The interceptor wraps whatever your controller method returns inside `data`.
 *   - If you return `{ items: [], total: 10 }` from a controller, the client gets
 *     `{ success: true, data: { items: [], total: 10 }, timestamp: '...' }`.
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WrappedResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, WrappedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
