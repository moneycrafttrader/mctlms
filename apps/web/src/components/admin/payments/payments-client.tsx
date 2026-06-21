'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CreatePlanForm } from './create-plan-form';
import { StudentLedger } from './student-ledger';

interface PaymentsClientProps {
  students: { id: string; name: string; email: string }[];
  courses: { id: string; name: string }[];
}

export function PaymentsClient({
  students,
  courses,
}: PaymentsClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payments &amp; Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage payment plans, installments, invoices, and receipts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create Payment Plan
        </button>
      </div>

      <StudentLedger students={students} />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payment Plan"
      >
        <CreatePlanForm
          students={students}
          courses={courses}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}
