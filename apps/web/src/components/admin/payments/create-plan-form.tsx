'use client';

import { useState } from 'react';
import { createPaymentPlan } from '@/lib/api/payments';

interface CreatePlanFormProps {
  students: { id: string; name: string; email: string }[];
  courses: { id: string; name: string }[];
  onSuccess: () => void;
}

export function CreatePlanForm({
  students,
  courses,
  onSuccess,
}: CreatePlanFormProps) {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfInstallments, setNumberOfInstallments] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createPaymentPlan(
        {
          studentId,
          courseId,
          totalAmount: parseFloat(totalAmount),
          numberOfInstallments: parseInt(numberOfInstallments, 10),
          startDate: startDate || undefined,
        },
      );
      setStudentId('');
      setCourseId('');
      setTotalAmount('');
      setNumberOfInstallments('');
      setStartDate('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create payment plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Student</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Select a student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Course</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Select a course...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Total Amount (&#x20B9;)
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="e.g. 50000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Number of Installments
        </label>
        <input
          type="number"
          min="1"
          required
          value={numberOfInstallments}
          onChange={(e) => setNumberOfInstallments(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="e.g. 3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Start Date (optional)
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Creating Plan...' : 'Create Payment Plan'}
      </button>
    </form>
  );
}
