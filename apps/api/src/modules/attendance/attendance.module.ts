/*
 * Attendance module — manual marking and reporting
 *
 * Why this module exists:
 *   - Groups attendance-related code (manual override, reports, CSV export) in one place.
 *   - Auto-attendance from Zoom is handled in ZoomWebhookHandler — this module only
 *     deals with manual operations and read-only reports.
 *   - No external module imports needed because SupabaseService is globally available.
 *
 * A junior should know:
 *   - Attendance comes from two sources: Zoom webhooks (auto) and this module (manual).
 *   - The manual mark UPSERTS so teacher overrides always win.
 *   - CSV export builds the string manually — no external libraries.
 */
import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
