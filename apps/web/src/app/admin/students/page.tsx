import { createClient } from '@/lib/supabase/server';
import { getStudents } from '@/lib/api/users';
import { StudentsPageClient } from '@/components/admin/students/students-page-client';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  let students: any[] = [];
  let total = 0;

  try {
    const result = await getStudents(token);
    students = result.items;
    total = result.total;
  } catch {
    // API unavailable — render empty state
  }

  return (
    <StudentsPageClient
      initialStudents={students}
      initialTotal={total}
      token={token}
    />
  );
}
