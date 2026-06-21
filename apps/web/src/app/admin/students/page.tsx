import { getStudents } from '@/lib/api/users';
import { StudentsPageClient } from '@/components/admin/students/students-page-client';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  let students: any[] = [];
  let total = 0;

  try {
    const result = await getStudents();
    students = result.items;
    total = result.total;
  } catch {
    // API unavailable — render empty state
  }

  return (
    <StudentsPageClient
      initialStudents={students}
      initialTotal={total}
    />
  );
}
