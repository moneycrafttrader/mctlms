/*
 * Analytics controller — endpoints for dashboard aggregate data
 *
 * Why this controller exists:
 *   - Single endpoint that returns everything the admin dashboard needs.
 *   - Thin HTTP layer — delegates to AnalyticsService.
 *
 * A junior should know:
 *   - GET /analytics/admin-overview is admin-only (see @Roles decorator).
 *   - The service runs all queries in parallel for fast responses.
 */
import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/admin-overview
   *
   * Returns aggregate stats for the admin dashboard:
   *   - studentCount, totalRevenue, activeCourses, upcomingSessions[]
   */
  @Roles(UserRole.ADMIN)
  @Get('admin-overview')
  getAdminOverview() {
    return this.analyticsService.getAdminOverview();
  }
}
