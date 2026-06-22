import { getMyVideos, type StudentVideo, getStudentBatchCurriculum, type StudentCurriculumCategory } from '@/lib/api/videos';
import { getMyCourses } from '@/lib/api/courses';
import { PageHeader } from '@/components/shared/PageHeader';
import { CurriculumView } from './curriculum-view';
import { RecordingsList } from './recordings-list';

export const dynamic = 'force-dynamic';

export default async function StudentVideosPage() {
  let recordings: StudentVideo[] = [];
  let curriculumData: { batchId: string; batchName: string; categories: StudentCurriculumCategory[] }[] = [];

  try {
    const [recs, courses] = await Promise.all([
      getMyVideos(),
      getMyCourses(),
    ]);
    recordings = recs;

    const enrolledBatches = courses.flatMap((c: any) => c.enrolledBatches ?? []);
    const batchIds = [...new Set(enrolledBatches.map((b: any) => b.id))];
    const batchMap = new Map(enrolledBatches.map((b: any) => [b.id, b.name]));

    const batchCurricula = await Promise.all(
      batchIds.map((bid) =>
        getStudentBatchCurriculum(bid).then((cats) => ({
          batchId: bid,
          batchName: batchMap.get(bid) ?? 'Unknown',
          categories: cats,
        })).catch(() => null),
      ),
    );
    curriculumData = batchCurricula.filter((c): c is NonNullable<typeof c> => c !== null && c.categories.length > 0);
  } catch {
    // API unavailable — fall back to flat list
  }

  if (curriculumData.length > 0) {
    return (
      <div>
        <PageHeader title="Recordings" subtitle="Organized by curriculum" />
        <div className="space-y-8 px-4 md:px-0">
          {curriculumData.map((batch) => (
            <CurriculumView
              key={batch.batchId}
              batchName={batch.batchName}
              batchId={batch.batchId}
              categories={batch.categories}
              recordings={recordings}
            />
          ))}
        </div>
      </div>
    );
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
