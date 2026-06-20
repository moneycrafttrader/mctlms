'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { getCourses, assignStudentsToBatch, type Course } from '@/lib/api/courses';

interface AssignBatchModalProps {
  isOpen: boolean;
  studentIds: string[];
  studentLabel: string;
  onClose: () => void;
  onSuccess: () => void;
  token?: string;
}

export function AssignBatchModal({
  isOpen,
  studentIds,
  studentLabel,
  onClose,
  onSuccess,
  token,
}: AssignBatchModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCourses(token);
      setCourses(result.items.filter((c) => c.is_active));
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCourseId('');
      setSelectedBatchId('');
      setError('');
      fetchCourses();
    }
  }, [isOpen, fetchCourses]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const availableBatches = (selectedCourse?.batches ?? []).filter((b) => b.is_active);

  const canSubmit = selectedCourseId && selectedBatchId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await assignStudentsToBatch(selectedBatchId, studentIds, token);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign students');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBatchName = availableBatches.find((b) => b.id === selectedBatchId)?.name;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assign to Batch</h2>
            <p className="text-sm text-gray-500">{studentLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No active courses available. Create a course first.
            </div>
          ) : (
            <>
              {/* Step 1: Select Course */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Step 1: Select Course
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedBatchId('');
                    }}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Step 2: Select Batch */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Step 2: Select Batch
                </label>
                <div className="relative">
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={!selectedCourseId}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {selectedCourseId
                        ? availableBatches.length === 0
                          ? 'No batches in this course'
                          : 'Choose a batch...'
                        : 'Select a course first'}
                    </option>
                    {availableBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                {selectedCourseId && availableBatches.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    This course has no batches. Create one in Courses &amp; Batches.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? 'Assigning...'
              : selectedBatchName
                ? `Assign to ${selectedBatchName}`
                : 'Assign to Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
