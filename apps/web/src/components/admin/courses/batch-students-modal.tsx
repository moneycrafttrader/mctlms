'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, UserPlus, Loader2 } from 'lucide-react';
import {
  addStudentToBatch,
  getBatchStudents,
  type StudentProfile,
} from '@/lib/api/courses';

interface BatchStudentsModalProps {
  isOpen: boolean;
  batchId: string;
  batchName: string;
  onClose: () => void;
  token?: string;
}

export function BatchStudentsModal({
  isOpen,
  batchId,
  batchName,
  onClose,
  token,
}: BatchStudentsModalProps) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBatchStudents(batchId, token);
      setStudents(result.items);
      setTotal(result.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [batchId, token]);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setShowAddForm(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setError('');
    }
  }, [isOpen, fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addStudentToBatch(batchId, { firstName, lastName, email, phone: phone || undefined }, token);
      setShowAddForm(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      fetchStudents();
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
            <p className="text-sm text-gray-500">{batchName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Add Student button / form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-300 px-4 py-3 text-sm font-medium text-brand-600 hover:border-brand-500 hover:bg-brand-50"
            >
              <UserPlus className="h-4 w-4" />
              Add Student
            </button>
          ) : (
            <form onSubmit={handleAddStudent} className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">New Student</h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {error && (
                <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Adding...' : 'Add to Batch'}
              </button>
            </form>
          )}

          {/* Student roster */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Enrolled Students ({total})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                <UserPlus className="mx-auto mb-2 h-6 w-6" />
                No students enrolled yet
              </div>
            ) : (
              <ul className="space-y-1">
                {students.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-gray-500">{s.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
