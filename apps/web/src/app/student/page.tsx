import { createClient } from '@/lib/supabase/server';
import { getMyCourses, type StudentCourse } from '@/lib/api/courses';
import { getMySessions, type LiveSession } from '@/lib/api/live-sessions';
import { getMyVideos, type StudentVideo } from '@/lib/api/videos';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardNextClass } from './dashboard-next-class';
import { DashboardUpcomingList } from './dashboard-upcoming-list';
import { DashboardRecentRecordings } from './dashboard-recent-recordings';
import { DashboardCourses } from './dashboard-courses';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let courses: StudentCourse[] = [];
  let upcoming: LiveSession[] = [];
  let past: (LiveSession & { attendanceStatus?: string })[] = [];
  let recordings: StudentVideo[] = [];

  try {
    const [coursesResult, sessionsResult, recordingsResult] = await Promise.all([
      getMyCourses(token),
      getMySessions(token),
      getMyVideos(undefined, token),
    ]);
    courses = coursesResult;
    upcoming = sessionsResult.upcoming ?? [];
    past = sessionsResult.past ?? [];
    recordings = recordingsResult;
  } catch {
    // API unavailable
  }

  const nextClass = upcoming.length > 0
    ? upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]
    : null;

  return (
    <div className="space-y-6 px-4 py-4 md:px-0 md:py-0">
      <DashboardGreeting />

      <DashboardNextClass session={nextClass} token={token} />

      {upcoming.length > 1 && (
        <DashboardUpcomingList sessions={upcoming.slice(1)} token={token} />
      )}

      <DashboardRecentRecordings recordings={recordings} token={token} />

      <DashboardCourses courses={courses} />
    </div>
  );
}
