'use client';

import { useState } from 'react';
import { createBatch, updateBatch, type Batch, type Course } from '@/lib/api/courses';

const SCHEDULE_TYPES = [
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'custom', label: 'Custom' },
];

interface BatchFormProps {
  courseId: string;
  onSuccess: () => void;
  batch?: Batch;
  courses?: Course[];
}

export function BatchForm({ courseId, onSuccess, batch, courses }: BatchFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [name, setName] = useState(batch?.name ?? '');
  const [scheduleType, setScheduleType] = useState(batch?.schedule_type ?? 'weekday');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!batch;
  const needsCourseSelection = !selectedCourseId && !isEditing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await updateBatch(batch.id, { name, scheduleType });
      } else {
        if (!selectedCourseId) {
          setError('Please select a course.');
          setSubmitting(false);
          return;
        }
        await createBatch(selectedCourseId, { name, scheduleType });
      }
      setName('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} batch`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {needsCourseSelection && courses && (
        <div>
          <label htmlFor="batch-course" className="block text-sm font-medium text-gray-700">
            Course
          </label>
          <select
            id="batch-course"
            required
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select a course...</option>
            {courses
              .filter((c) => c.is_active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      )}

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
        {submitting ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Batch' : 'Create Batch'}
      </button>
    </form>
  );
}
