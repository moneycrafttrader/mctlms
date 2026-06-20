import { createClient } from '@/lib/supabase/server';
import { getAdminVideos, getVideoTopics } from '@/lib/api/videos';
import { RecordingsPageClient } from '@/components/admin/recordings/recordings-page-client';

export const dynamic = 'force-dynamic';

export default async function AdminRecordingsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let initialVideos: any[] = [];
  let topics: any[] = [];
  let total = 0;

  try {
    const [videosResult, topicsResult] = await Promise.all([
      getAdminVideos({ page: 1, limit: 50 }, token),
      getVideoTopics(token),
    ]);
    initialVideos = videosResult.items;
    total = videosResult.total;
    topics = topicsResult;
  } catch {
    // API unavailable — render empty state
  }

  return (
    <RecordingsPageClient
      initialVideos={initialVideos}
      total={total}
      topics={topics}
      token={token}
    />
  );
}
