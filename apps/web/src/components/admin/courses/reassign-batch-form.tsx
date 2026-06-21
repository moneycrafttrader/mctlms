'use client';

import { useState } from 'react';
import { reassignBatch } from '@/lib/api/courses';

interface ReassignBatchFormProps {
  batchId: string;
  batchName: string;
  currentCourseId: string;
  courses: { id: string; name: string }[];
  onSuccess: () => void;
}

export function ReassignBatchForm({
  batchId,
  batchName,
  currentCourseId,
  courses,
  onSuccess,
}: ReassignBatchFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableCourses = courses.filter((c) => c.id !== currentCourseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setError('Please select a target course');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      await reassignBatch(batchId, selectedCourseId);
      setSelectedCourseId('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Move <strong>{batchName}</strong> to another course:
      </p>

      <div>
        <label htmlFor="target-course" className="block text-sm font-medium text-gray-700">
          Target Course
        </label>
        <select
          id="target-course"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Select a course...</option>
          {availableCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedCourseId}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Reassigning...' : 'Reassign Batch'}
      </button>
    </form>
  );
}
