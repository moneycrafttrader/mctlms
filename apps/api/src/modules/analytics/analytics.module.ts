/*
 * Analytics module — registers the controller and service
 *
 * Why this module exists:
 *   - Self-contained feature for dashboard aggregate queries.
 *   - Imported by AppModule.
 *
 * A junior should know:
 *   - No custom providers needed — SupabaseService is @Global().
 */
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
