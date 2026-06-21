import { getMyVideos, type StudentVideo } from '@/lib/api/videos';
import { PageHeader } from '@/components/shared/PageHeader';
import { RecordingsList } from './recordings-list';

export const dynamic = 'force-dynamic';

export default async function StudentVideosPage() {
  let recordings: StudentVideo[] = [];
  try {
    recordings = await getMyVideos();
  } catch {
    // API unavailable
  }

  return (
    <div>
      <PageHeader
        title="Recordings"
        subtitle={`${recordings.length} recording${recordings.length !== 1 ? 's' : ''}`}
      />
      <div className="px-4 md:px-0">
        <RecordingsList recordings={recordings} />
      </div>
    </div>
  );
}
