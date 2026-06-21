import { ViolationsAdminClient } from '@/components/admin/violations/violations-admin-client';

export const dynamic = 'force-dynamic';

export default function ViolationsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring & Violations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Screen recording detection, violation history, and risk scores.
        </p>
      </div>
      <ViolationsAdminClient />
    </div>
  );
}
