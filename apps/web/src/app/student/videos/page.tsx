import { getMyVideosGrouped, getMyVideos, type StudentBatchRecordings, type StudentVideo } from '@/lib/api/videos';
import { PageHeader } from '@/components/shared/PageHeader';
import { StudentVideosGrouped } from './student-videos-grouped';
import { RecordingsList } from './recordings-list';

export const dynamic = 'force-dynamic';

export default async function StudentVideosPage() {
  let groupedData: StudentBatchRecordings[] = [];
  let flatRecordings: StudentVideo[] = [];

  try {
    groupedData = await getMyVideosGrouped();
  } catch {
    // Fallback to flat list
    try {
      flatRecordings = await getMyVideos();
    } catch {}
  }

  if (groupedData.length > 0) {
    return (
      <div>
        <PageHeader title="Recordings" subtitle="Organized by batch and section" />
        <div className="space-y-8 px-4 md:px-0">
          <StudentVideosGrouped data={groupedData} />
        </div>
      </div>
    );
  }

  const total = flatRecordings.length;
  return (
    <div>
      <PageHeader
        title="Recordings"
        subtitle={`${total} recording${total !== 1 ? 's' : ''}`}
      />
      <div className="px-4 md:px-0">
        <RecordingsList recordings={flatRecordings} />
      </div>
    </div>
  );
}
