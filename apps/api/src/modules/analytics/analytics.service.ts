/*
 * Analytics service — aggregates dashboard data for the admin overview
 *
 * Why this service exists:
 *   - Runs 4 lightweight aggregate queries in parallel to build a single
 *     dashboard overview response.
 *   - Keeps business logic out of the controller.
 *
 * A junior should know:
 *   - All queries use the service-role Supabase client (bypasses RLS).
 *   - The `Promise.all` pattern runs all 4 queries concurrently for speed.
 *   - Total revenue sums the `amount` column from the `payments` table.
 */
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Build the admin overview payload.
   *
   * Executes 4 parallel queries:
   *   1. Student count (active profiles with role 'student')
   *   2. Total revenue (sum of all payment amounts)
   *   3. Active course count
   *   4. Next 5 upcoming live sessions
   */
  async getAdminOverview() {
    const results = await Promise.allSettled([
      // 1. Student count
      this.supabaseService.client
        .from(TABLES.PROFILES)
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true),

      // 2. Total revenue
      this.supabaseService.client
        .from(TABLES.PAYMENTS)
        .select('amount'),

      // 3. Active course count
      this.supabaseService.client
        .from(TABLES.COURSES)
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // 4. Upcoming sessions (next 5)
      this.supabaseService.client
        .from(TABLES.LIVE_SESSIONS)
        .select('id, topic, start_time, duration_minutes')
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5),
    ]);

    const studentCount = results[0].status === 'fulfilled' ? (results[0].value as any).count ?? 0 : 0;
    const revenueResult = results[1].status === 'fulfilled' ? results[1].value : null;
    const courseResult = results[2].status === 'fulfilled' ? results[2].value : null;
    const sessionsResult = results[3].status === 'fulfilled' ? results[3].value : null;

    const activeCourses = (courseResult as any)?.count ?? 0;
    const totalRevenue = ((revenueResult?.data ?? []) as any[]).reduce(
      (sum: number, row: any) => sum + Number(row.amount ?? 0),
      0,
    );

    return {
      studentCount,
      totalRevenue,
      activeCourses,
      upcomingSessions: ((sessionsResult?.data ?? []) as any[]).map((s: any) => ({
        id: s.id,
        topic: s.topic,
        startTime: s.start_time,
        durationMinutes: s.duration_minutes,
      })),
    };
  }
}
