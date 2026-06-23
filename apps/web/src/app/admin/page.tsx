import { getAdminOverview } from '@/lib/api/analytics';
import { getMySessions } from '@/lib/api/live-sessions';
import { getReviewQueue } from '@/lib/api/assessments';
import { getEmailStats } from '@/lib/api/email-logs';
import { getObservabilityDashboard } from '@/lib/api/observability';
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
  let failedEmails = 0;
  let systemErrors = 0;
  let totalEmails = 0;

  try {
    const results = await Promise.allSettled([
      getAdminOverview(),
      getReviewQueue({ status: 'pending', limit: 5 }),
      getMySessions(),
      getEmailStats().catch(() => null),
      getObservabilityDashboard().catch(() => null),
    ]);

    if (results[0].status === 'fulfilled') overview = results[0].value;
    if (results[1].status === 'fulfilled') reviewQueue = Array.isArray(results[1].value) ? results[1].value : [];
    if (results[2].status === 'fulfilled') {
      const rawSessions = (results[2].value as { upcoming?: unknown[] }).upcoming ?? [];
      liveSessions = (rawSessions as any[]).slice(0, 5).map((s) => ({
        id: String(s.id),
        topic: String(s.topic),
        start_time: String(s.start_time),
        duration_minutes: Number(s.duration_minutes),
        status: String(s.status),
      }));
    }
    if (results[3].status === 'fulfilled' && results[3].value) {
      failedEmails = results[3].value.failed ?? 0;
      totalEmails = results[3].value.total ?? 0;
    }
    if (results[4].status === 'fulfilled' && results[4].value) {
      systemErrors = results[4].value.errorCountsLast24h ?? 0;
    }
  } catch {
    // APIs unavailable
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
      failedEmails={failedEmails}
      systemErrors={systemErrors}
      totalEmails={totalEmails}
    />
  );
}
