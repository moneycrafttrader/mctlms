'use client';

import { useState } from 'react';
import { createBatch } from '@/lib/api/courses';

const SCHEDULE_TYPES = [
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'custom', label: 'Custom' },
];

interface BatchFormProps {
  courseId: string;
  onSuccess: () => void;
  token?: string;
}

export function BatchForm({ courseId, onSuccess, token }: BatchFormProps) {
  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState('weekday');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createBatch(courseId, { name, scheduleType }, token);
      setName('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="batch-name" className="block text-sm font-medium text-gray-700">
          Batch Name
        </label>
        <input
          id="batch-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="e.g. Morning Batch"
        />
      </div>

      <div>
        <label htmlFor="batch-schedule" className="block text-sm font-medium text-gray-700">
          Schedule Type
        </label>
        <select
          id="batch-schedule"
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {SCHEDULE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create Batch'}
      </button>
    </form>
  );
}
