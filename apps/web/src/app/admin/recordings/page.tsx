import { getAdminVideos, getVideoTopics } from '@/lib/api/videos';
import { RecordingsPageClient } from '@/components/admin/recordings/recordings-page-client';

export const dynamic = 'force-dynamic';

export default async function AdminRecordingsPage() {
  let initialVideos: any[] = [];
  let topics: any[] = [];
  let total = 0;

  try {
    const [videosResult, topicsResult] = await Promise.all([
      getAdminVideos({ page: 1, limit: 50 }),
      getVideoTopics(),
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
    />
  );
}
