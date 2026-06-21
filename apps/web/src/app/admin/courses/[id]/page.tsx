import { getCourse, getCourseStats, getCourseBatches, getCourses } from '@/lib/api/courses';
import { CourseDetailsView } from '@/components/admin/courses/course-details-view';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminCourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  try {
    const [course, stats, allCoursesResult] = await Promise.all([
      getCourse(id),
      getCourseStats(id),
      getCourses(),
    ]);

    return (
      <CourseDetailsView
        courseId={id}
        courseName={course.name}
        initialStats={stats}
        initialBatches={course.batches ?? []}
        allCourses={allCoursesResult.items}
      />
    );
  } catch {
    notFound();
  }
}
