import { createClient } from '@/lib/supabase/server';
import { getMyCourses, type StudentCourse } from '@/lib/api/courses';
import { getMySessions, type LiveSession } from '@/lib/api/live-sessions';
import { getMyPaymentPlans, type PaymentPlan } from '@/lib/api/payments';
import { EnrolledCoursesGrid } from '@/components/student/dashboard/enrolled-courses-grid';
import { PendingPaymentsWidget } from '@/components/student/dashboard/pending-payments-widget';
import { NextSessionCard } from '@/components/student/dashboard/next-session-card';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let courses: StudentCourse[] = [];
  let sessions: LiveSession[] = [];
  let paymentPlans: PaymentPlan[] = [];

  try {
    const [coursesResult, sessionsResult, plansResult] = await Promise.all([
      getMyCourses(token),
      getMySessions(token),
      getMyPaymentPlans(token),
    ]);
    courses = coursesResult;
    sessions = [...(sessionsResult.upcoming ?? []), ...(sessionsResult.past ?? [])];
    paymentPlans = plansResult;
  } catch {
    // API unavailable — render empty state
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here is your learning overview.
        </p>
      </div>

      <NextSessionCard sessions={sessions} token={token} />

      <PendingPaymentsWidget plans={paymentPlans} />

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          My Courses
        </h2>
        <EnrolledCoursesGrid courses={courses} />
      </section>
    </div>
  );
}
