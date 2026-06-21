'use client';

import { useState } from 'react';
import { createCourse } from '@/lib/api/courses';

interface CourseFormProps {
  onSuccess: () => void;
}

export function CourseForm({ onSuccess }: CourseFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createCourse({ name, description: description || undefined });
      setName('');
      setDescription('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="course-name" className="block text-sm font-medium text-gray-700">
          Course Name
        </label>
        <input
          id="course-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="e.g. Stock Market Fundamentals"
        />
      </div>

      <div>
        <label htmlFor="course-desc" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          id="course-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Brief description of the course..."
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
        {submitting ? 'Creating...' : 'Create Course'}
      </button>
    </form>
  );
}
