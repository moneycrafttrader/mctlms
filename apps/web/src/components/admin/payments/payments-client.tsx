'use client';

import { useState } from 'react';
import { Plus, IndianRupee, Users, CreditCard } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import { AdminSection } from '@/components/shared/AdminSection';
import { AdminStatCard } from '@/components/shared/AdminStatCard';
import { CreatePlanForm } from './create-plan-form';
import { StudentLedger } from './student-ledger';

interface PaymentsClientProps {
  students: { id: string; name: string; email: string }[];
  courses: { id: string; name: string }[];
}

export function PaymentsClient({ students, courses }: PaymentsClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Payments & Plans" description="Manage payment plans, installments, invoices, and receipts." actions={
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"><Plus className="h-4 w-4" /> Create Plan</button>
      } />

      <AdminSection title="Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminStatCard label="Total Students" value={students.length} icon={Users} iconColor="bg-brand-50 text-brand-600" />
          <AdminStatCard label="Active Courses" value={courses.length} icon={CreditCard} iconColor="bg-emerald-50 text-emerald-600" />
          <AdminStatCard label="Finance Center" value="Open" icon={IndianRupee} iconColor="bg-blue-50 text-blue-600" onClick={() => window.location.href = '/admin/finance'} />
        </div>
      </AdminSection>

      <StudentLedger students={students} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Payment Plan">
        <CreatePlanForm students={students} courses={courses} onSuccess={() => setShowCreateModal(false)} />
      </Modal>
    </div>
  );
}
