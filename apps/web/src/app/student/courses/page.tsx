import { createClient } from '@/lib/supabase/server';
import { getMyCourses, type StudentCourse, type Batch } from '@/lib/api/courses';
import { PageHeader } from '@/components/shared/PageHeader';
import { CoursesListClient } from './courses-list-client';

export const dynamic = 'force-dynamic';

export default async function StudentCoursesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let courses: StudentCourse[] = [];
  try {
    courses = await getMyCourses(token);
  } catch {
    // API unavailable
  }

  return (
    <div>
      <PageHeader
        title="My Courses"
        subtitle={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
      />
      <div className="px-4 md:px-0">
        <CoursesListClient courses={courses} token={token} />
      </div>
    </div>
  );
}
