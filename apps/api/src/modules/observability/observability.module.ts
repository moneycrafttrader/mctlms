import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';
import { ObservabilityInterceptor } from './observability.interceptor';

@Module({
  controllers: [ObservabilityController],
  providers: [
    ObservabilityService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ObservabilityInterceptor,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
