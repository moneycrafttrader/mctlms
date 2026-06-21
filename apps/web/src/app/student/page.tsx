import { getMyCourses, type StudentCourse } from '@/lib/api/courses';
import { getMySessions, type LiveSession } from '@/lib/api/live-sessions';
import { getMyVideos, type StudentVideo } from '@/lib/api/videos';
import { getMyResults } from '@/lib/api/assessments';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  let courses: StudentCourse[] = [];
  let upcoming: LiveSession[] = [];
  let past: (LiveSession & { attendanceStatus?: string })[] = [];
  let recordings: StudentVideo[] = [];
  let results: unknown[] = [];

  try {
    const [coursesResult, sessionsResult, recordingsResult, resultsResult] = await Promise.all([
      getMyCourses(),
      getMySessions(),
      getMyVideos(),
      getMyResults().catch(() => [] as unknown[]),
    ]);
    courses = coursesResult;
    upcoming = sessionsResult.upcoming ?? [];
    past = sessionsResult.past ?? [];
    recordings = recordingsResult;
    results = resultsResult;
  } catch {
    // API unavailable — render with empty state
  }

  const nextClass = upcoming.length > 0
    ? upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]
    : null;

  const inProgressVideos = recordings.filter((r) => !r.progress.completed && r.progress.watched_seconds > 0);
  const continueContent = inProgressVideos.length > 0 ? inProgressVideos : recordings.slice(0, 6);

  return (
    <DashboardClient
      name="Trader"
      nextClass={nextClass}
      upcoming={upcoming}
      continueContent={continueContent}
      courses={courses}
      recordings={recordings}
      results={results}
      pastSessions={past}
    />
  );
}
