import { redirect } from 'next/navigation';
import { getCourses } from '@/lib/api/courses';
import { CourseList } from '@/components/admin/courses/course-list';
import { ApiError } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  let initialCourses: any[] = [];

  try {
    const result = await getCourses();
    initialCourses = result.items;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    // Other errors (backend unavailable, network) — render empty state
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CourseList initialCourses={initialCourses} />
    </div>
  );
}
