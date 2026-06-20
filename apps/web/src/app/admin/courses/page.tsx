import { createClient } from '@/lib/supabase/server';
import { getCourses } from '@/lib/api/courses';
import { CourseList } from '@/components/admin/courses/course-list';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let initialCourses: any[] = [];

  try {
    const result = await getCourses(token);
    initialCourses = result.items;
  } catch {
    // API unavailable — render empty state
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CourseList initialCourses={initialCourses} token={token} />
    </div>
  );
}
