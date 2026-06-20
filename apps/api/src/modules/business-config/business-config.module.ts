/*
 * Business Config module — registers the controller and service
 *
 * Why this module exists:
 *   - Keeps the business config feature self-contained (controller + service + DTO).
 *   - Imported by AppModule to register endpoints under /business-config.
 *
 * A junior should know:
 *   - No extra providers needed — SupabaseService is @Global().
 *   - Add this module to AppModule imports when adding new features.
 */
import { Module } from '@nestjs/common';
import { BusinessConfigController } from './business-config.controller';
import { BusinessConfigService } from './business-config.service';

@Module({
  controllers: [BusinessConfigController],
  providers: [BusinessConfigService],
})
export class BusinessConfigModule {}
