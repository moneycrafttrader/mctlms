import { getAdminOverview } from '@/lib/api/analytics';
import { getStudents } from '@/lib/api/users';
import { getEmailStats } from '@/lib/api/email-logs';
import { FinanceWorkspace } from '@/components/admin/finance/finance-workspace';

export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
  const results = await Promise.allSettled([
    getAdminOverview(),
    getStudents(),
    getEmailStats().catch(() => null),
  ]);

  const overview = results[0].status === 'fulfilled' ? results[0].value : { studentCount: 0, totalRevenue: 0, activeCourses: 0, upcomingSessions: [] };
  const studentsData = results[1].status === 'fulfilled' ? results[1].value : { items: [], total: 0 };
  const emailStats = results[2].status === 'fulfilled' ? results[2].value : null;

  return (
    <FinanceWorkspace
      totalRevenue={overview.totalRevenue}
      studentCount={overview.studentCount}
      initialStudents={studentsData.items}
      initialEmailStats={emailStats}
    />
  );
}
