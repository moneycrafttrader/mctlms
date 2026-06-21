import { getAdminOverview } from '@/lib/api/analytics';
import { getMySessions } from '@/lib/api/live-sessions';
import { getReviewQueue } from '@/lib/api/assessments';
import { AdminDashboardClient } from './admin-dashboard-client';

export const dynamic = 'force-dynamic';

interface SessionInfo {
  id: string;
  topic: string;
  start_time: string;
  duration_minutes: number;
  status?: string;
}

export default async function AdminDashboardPage() {
  let overview = {
    studentCount: 0,
    totalRevenue: 0,
    activeCourses: 0,
    upcomingSessions: [] as { id: string; topic: string; startTime: string; durationMinutes: number }[],
  };
  let reviewQueue: unknown[] = [];
  let liveSessions: SessionInfo[] = [];

  try {
    const [overviewData, queueData, sessionsData] = await Promise.all([
      getAdminOverview(),
      getReviewQueue({ status: 'pending', limit: 5 }).catch(() => []),
      getMySessions().catch(() => ({ upcoming: [], past: [] })),
    ]);
    overview = overviewData;
    reviewQueue = Array.isArray(queueData) ? queueData : [];
    const rawSessions = (sessionsData as { upcoming?: unknown[] }).upcoming ?? [];
    liveSessions = rawSessions.slice(0, 5).map((s) => {
      const rec = s as Record<string, unknown>;
      return {
        id: String(rec.id),
        topic: String(rec.topic),
        start_time: String(rec.start_time),
        duration_minutes: Number(rec.duration_minutes),
        status: String(rec.status),
      };
    });
  } catch {
    // API unavailable
  }

  const sessions: SessionInfo[] = liveSessions.length > 0
    ? liveSessions
    : overview.upcomingSessions.slice(0, 5).map((s) => ({
        id: s.id,
        topic: s.topic,
        start_time: s.startTime,
        duration_minutes: s.durationMinutes,
        status: 'scheduled',
      }));

  return (
    <AdminDashboardClient
      studentCount={overview.studentCount}
      totalRevenue={overview.totalRevenue}
      activeCourses={overview.activeCourses}
      upcomingSessions={sessions}
      reviewCount={reviewQueue.length}
    />
  );
}
