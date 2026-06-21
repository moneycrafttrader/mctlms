import { getStudentCourse } from '@/lib/api/courses';
import { getMySessions } from '@/lib/api/live-sessions';
import { getBatchVideos } from '@/lib/api/videos';
import { PageHeader } from '@/components/shared/PageHeader';
import { CourseDetailSessions } from './course-detail-sessions';
import { CourseDetailRecordings } from './course-detail-recordings';

export const dynamic = 'force-dynamic';

interface Props {
  params: { courseId: string };
}

export default async function StudentCourseDetailPage({ params }: Props) {
  try {
    const course = await getStudentCourse(params.courseId);
    const enrolledBatches = (course as any).enrolledBatches ?? [];

    if (enrolledBatches.length === 0) {
      return <AccessDenied />;
    }

    const batch = enrolledBatches[0];

    const [sessionsResult, videos] = await Promise.all([
      getMySessions(),
      getBatchVideos(batch.id),
    ]);

    const allSessions = [
      ...(sessionsResult.upcoming ?? []),
      ...(sessionsResult.past ?? []),
    ];

    const now = new Date();
    const upcomingSessions = allSessions
      .filter((s) => s.status === 'scheduled' || s.status === 'live')
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
    const pastSessions = allSessions
      .filter((s) => s.status === 'ended' || s.status === 'cancelled')
      .sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
      );

    return (
      <div>
        <PageHeader title={course.name} showBack />
        <div className="space-y-6 px-4 md:px-0">
          <div className="rounded-card border border-surface-border bg-surface-card p-4">
            {course.description && (
              <p className="text-sm text-text-secondary">{course.description}</p>
            )}
            {enrolledBatches.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {enrolledBatches.map((b: any) => (
                  <span
                    key={b.id}
                    className="rounded-full bg-brand-navy/10 px-2.5 py-0.5 text-xs font-medium text-brand-navy"
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <CourseDetailSessions
            upcoming={upcomingSessions}
            past={pastSessions}
          />

          <CourseDetailRecordings videos={videos} />
        </div>
      </div>
    );
  } catch {
    return <ErrorState />;
  }
}

function AccessDenied() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-red-600">Access Denied</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You are not assigned to an active batch for this course.
        </p>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-text-primary">
          Failed to load course
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Please try refreshing the page or contact support.
        </p>
      </div>
    </div>
  );
}
