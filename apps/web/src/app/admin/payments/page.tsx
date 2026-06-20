import { createClient } from '@/lib/supabase/server';
import { getStudents } from '@/lib/api/users';
import { getCourses } from '@/lib/api/courses';
import { PaymentsClient } from '@/components/admin/payments/payments-client';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let students: { id: string; name: string; email: string }[] = [];
  let courses: { id: string; name: string }[] = [];

  try {
    const [studentsResult, coursesResult] = await Promise.all([
      getStudents(token),
      getCourses(token),
    ]);
    students = studentsResult.items.map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
    }));
    courses = coursesResult.items.map((c: any) => ({
      id: c.id,
      name: c.name,
    }));
  } catch {
    // API unavailable
  }

  return (
    <PaymentsClient students={students} courses={courses} token={token} />
  );
}
