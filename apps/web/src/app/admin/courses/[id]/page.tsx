import { createClient } from '@/lib/supabase/server';
import { getCourse, getCourseStats, getCourseBatches, getCourses } from '@/lib/api/courses';
import { CourseDetailsView } from '@/components/admin/courses/course-details-view';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminCourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const { id } = params;

  try {
    const [course, stats, allCoursesResult] = await Promise.all([
      getCourse(id, token),
      getCourseStats(id, token),
      getCourses(token),
    ]);

    return (
      <CourseDetailsView
        courseId={id}
        courseName={course.name}
        initialStats={stats}
        initialBatches={course.batches ?? []}
        allCourses={allCoursesResult.items}
        token={token}
      />
    );
  } catch {
    notFound();
  }
}
