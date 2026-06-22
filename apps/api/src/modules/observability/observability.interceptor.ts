import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ObservabilityService } from './observability.service';

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(
    private readonly observabilityService: ObservabilityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<any>();
    const url = request.url ?? 'unknown';
    const method = request.method ?? 'UNKNOWN';

    return next.handle().pipe(
      tap(() => {
        try {
          const duration = Date.now() - startTime;
            this.observabilityService
              .trackMetric({
                metricName: 'endpoint_latency',
                value: duration,
                unit: 'ms',
                tags: { endpoint: url, method },
                userId: request.user?.id,
              })
              .catch(() => {});
        } catch {}
      }),
      catchError((error) => {
        try {
          const duration = Date.now() - startTime;
          this.observabilityService
            .logError(
              {
                message: error?.message ?? 'Unknown error',
                errorType: error?.name ?? 'InternalError',
                severity: 'error',
                stackTrace: error?.stack,
                context: {
                  url,
                  method,
                  duration,
                  statusCode: error?.status ?? 500,
                },
              },
              request.user?.id,
            )
            .catch(() => {});
        } catch {}

        return throwError(() => error);
      }),
    );
  }
}
