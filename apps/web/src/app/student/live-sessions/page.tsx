import { getMySessions, type LiveSession } from '@/lib/api/live-sessions';
import { PageHeader } from '@/components/shared/PageHeader';
import { LiveSessionsList } from './live-sessions-list';

export const dynamic = 'force-dynamic';

export default async function StudentLiveSessionsPage() {
  let upcoming: LiveSession[] = [];
  let past: (LiveSession & { attendanceStatus?: string })[] = [];

  try {
    const result = await getMySessions();
    upcoming = result.upcoming ?? [];
    past = result.past ?? [];
  } catch {
    // API unavailable
  }

  return (
    <div>
      <PageHeader
        title="Live Sessions"
        subtitle={`${upcoming.length} upcoming`}
      />
      <div className="px-4 md:px-0">
        <LiveSessionsList upcoming={upcoming} past={past} />
      </div>
    </div>
  );
}
