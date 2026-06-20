import { createClient } from '@/lib/supabase/server';
import { getAdminOverview } from '@/lib/api/analytics';
import { StatsGrid } from '@/components/admin/dashboard/stats-grid';
import { UpcomingSessionsWidget } from '@/components/admin/dashboard/upcoming-sessions-widget';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let overview = {
    studentCount: 0,
    totalRevenue: 0,
    activeCourses: 0,
    upcomingSessions: [] as { id: string; topic: string; startTime: string; durationMinutes: number }[],
  };

  try {
    overview = await getAdminOverview(token);
  } catch {
    // API unavailable — render with zeros
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your LMS platform.
        </p>
      </div>

      <StatsGrid data={overview} />

      <UpcomingSessionsWidget sessions={overview.upcomingSessions} />
    </div>
  );
}
