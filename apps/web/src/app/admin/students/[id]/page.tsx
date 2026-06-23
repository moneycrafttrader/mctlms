import { fetchApi } from '@/lib/api-client';
import { getStudentPlans } from '@/lib/api/payments';
import { getStudentAnalytics } from '@/lib/api/assessments';
import { getAuditLogs } from '@/lib/api/audit';
import { StudentWorkspace } from '@/components/admin/students/student-workspace';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  try {
    const results = await Promise.allSettled([
      fetchApi<any>(`/users/${params.id}`),
      fetchApi<any>(`/users/${params.id}/batches`),
      getStudentPlans(params.id),
      getStudentAnalytics(params.id),
      getAuditLogs({ actorId: params.id, limit: 50 }).catch(() => ({ items: [], total: 0 })),
      fetchApi<any>(`/attendance/student/${params.id}`).catch(() => null),
    ]);

    const student = results[0].status === 'fulfilled' ? results[0].value : null;
    const batches = results[1].status === 'fulfilled' ? results[1].value : [];
    const plans = results[2].status === 'fulfilled' ? results[2].value : [];
    const analytics = results[3].status === 'fulfilled' ? results[3].value : null;
    const auditData = results[4].status === 'fulfilled' ? results[4].value : { items: [], total: 0 };
    const attendance = results[5].status === 'fulfilled' ? results[5].value : null;

    if (!student) notFound();

    return (
      <StudentWorkspace
        student={student}
        initialBatches={batches}
        initialPlans={plans}
        initialAnalytics={analytics}
        initialAuditLogs={auditData.items}
      />
    );
  } catch {
    notFound();
  }
}
