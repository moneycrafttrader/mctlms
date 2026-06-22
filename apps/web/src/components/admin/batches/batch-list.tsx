'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BatchForm } from '@/components/admin/courses/batch-form';
import {
  type Batch,
  type Course,
  getAllBatches,
  getCourses,
  deleteBatch,
} from '@/lib/api/courses';

interface BatchListProps {
  initialBatches: Batch[];
  initialTotal: number;
}

export function BatchList({ initialBatches, initialTotal }: BatchListProps) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [total, setTotal] = useState(initialTotal);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getAllBatches({ isActive: false, page: 1, limit: 100 });
      setBatches(result.items);
      setTotal(result.total);
    } catch {
      // silently fail
    }
  }, []);

  const openCreateModal = async () => {
    try {
      const result = await getCourses();
      setCourses(result.items);
    } catch {
      setCourses([]);
    }
    setShowCreateModal(true);
  };

  const openEditModal = async (batch: Batch) => {
    try {
      const result = await getCourses();
      setCourses(result.items);
    } catch {
      setCourses([]);
    }
    setEditingBatch(batch);
  };

  const confirmDelete = async () => {
    if (!deletingBatch) return;
    try {
      await deleteBatch(deletingBatch.id);
      setDeletingBatch(null);
      refresh();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create Batch
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
          <BookOpen className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-lg font-medium">No batches found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Schedule</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{batch.name}</td>
                  <td className="px-6 py-4 text-gray-600">{(batch as any).course?.name ?? '-'}</td>
                  <td className="px-6 py-4 capitalize text-gray-600">{batch.schedule_type}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${batch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {batch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(batch)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        title="Edit batch"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingBatch(batch)}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                        title="Delete batch"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/admin/batches/${batch.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > batches.length && (
        <p className="mt-4 text-center text-sm text-gray-500">
          Showing {batches.length} of {total} batches
        </p>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Batch"
      >
        <BatchForm
          courseId=""
          courses={courses}
          onSuccess={() => {
            setShowCreateModal(false);
            refresh();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!editingBatch}
        onClose={() => setEditingBatch(null)}
        title="Edit Batch"
      >
        {editingBatch && (
          <BatchForm
            courseId={editingBatch.course_id}
            batch={editingBatch}
            courses={courses}
            onSuccess={() => {
              setEditingBatch(null);
              refresh();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingBatch}
        title="Delete Batch"
        message={`Are you sure you want to delete "${deletingBatch?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingBatch(null)}
      />
    </div>
  );
}
