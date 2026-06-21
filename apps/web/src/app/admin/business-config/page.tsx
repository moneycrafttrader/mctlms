import { BusinessConfigForm } from '@/components/admin/business-config/business-config-form';

export const dynamic = 'force-dynamic';

export default async function AdminBusinessConfigPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business details, GSTIN, and document numbering.
        </p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <BusinessConfigForm />
      </div>
    </div>
  );
}
