'use client';

import { AlertTriangle, IndianRupee, Calendar } from 'lucide-react';
import { type PaymentPlan } from '@/lib/api/payments';

interface PendingPaymentsWidgetProps {
  plans: PaymentPlan[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PendingPaymentsWidget({ plans }: PendingPaymentsWidgetProps) {
  const pendingInstallments = plans
    .flatMap((plan) =>
      (plan.installments ?? []).map((inst) => ({
        ...inst,
        courseName: (plan as any).course?.name ?? 'Course',
      })),
    )
    .filter((inst) => inst.status === 'pending' || inst.status === 'overdue')
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    );

  if (pendingInstallments.length === 0) return null;

  const isOverdue = pendingInstallments.some((i) => i.status === 'overdue');
  const totalDue = pendingInstallments.reduce(
    (sum, i) => sum + Number(i.amount),
    0,
  );

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        isOverdue
          ? 'border-red-200 bg-red-50'
          : 'border-yellow-200 bg-yellow-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg p-2 ${
            isOverdue ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {isOverdue ? 'Overdue Payments' : 'Pending Payments'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {pendingInstallments.length} installment
            {pendingInstallments.length !== 1 ? 's' : ''} due —{' '}
            <span className="font-semibold">{formatCurrency(totalDue)}</span>
          </p>

          <div className="mt-3 space-y-2">
            {pendingInstallments.slice(0, 3).map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-700">
                    {inst.courseName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Installment {inst.installment_number}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p
                    className={`text-xs font-semibold ${
                      inst.status === 'overdue' ? 'text-red-600' : 'text-yellow-700'
                    }`}
                  >
                    {formatCurrency(inst.amount)}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(inst.due_date)}
                  </p>
                </div>
              </div>
            ))}
            {pendingInstallments.length > 3 && (
              <p className="text-xs text-gray-400">
                +{pendingInstallments.length - 3} more
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
