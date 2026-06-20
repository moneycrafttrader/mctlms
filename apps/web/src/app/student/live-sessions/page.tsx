import { createClient } from '@/lib/supabase/server';
import { SessionList } from '@/components/student/live-sessions/session-list';

export const dynamic = 'force-dynamic';

export default async function StudentLiveSessionsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Join your scheduled live classes and review past sessions.
        </p>
      </div>
      <SessionList token={token} />
    </div>
  );
}
