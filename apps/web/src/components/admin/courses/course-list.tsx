'use client';

import { useState, useCallback } from 'react';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CourseForm } from './course-form';
import { BatchForm } from './batch-form';
import {
  type Course,
  type Batch,
  getCourses,
  deleteBatch,
  deleteCourse,
} from '@/lib/api/courses';

interface CourseListProps {
  initialCourses: Course[];
  token?: string;
}

export function CourseList({ initialCourses, token }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const revalidateServerCache = useCallback(async () => {
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/admin/courses' }),
      });
    } catch {
      // Revalidation is best-effort — the cache TTL will eventually expire
    }
  }, []);

  const refreshCourses = useCallback(async () => {
    try {
      const result = await getCourses(token);
      setCourses(result.items);
      revalidateServerCache();
    } catch {
      // silently fail — data stays as last-known state
    }
  }, [token, revalidateServerCache]);

  const openBatchModal = (courseId: string) => {
    setSelectedCourseId(courseId);
    setShowBatchModal(true);
  };

  const openEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
  };

  const confirmDeleteBatch = async () => {
    if (!deletingBatch) return;
    try {
      await deleteBatch(deletingBatch.id, token);
      setDeletingBatch(null);
      refreshCourses();
    } catch {
      // silently fail
    }
  };

  const confirmDeleteCourse = async () => {
    if (!deletingCourse) return;
    try {
      await deleteCourse(deletingCourse.id, token);
      setDeletingCourse(null);
      refreshCourses();
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses &amp; Batches</h1>
        <button
          onClick={() => setShowCourseModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
          <BookOpen className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-lg font-medium">No courses yet</p>
          <p className="text-sm">Create your first course to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => setDeletingCourse(course)}
                    className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                    title="Delete course"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>

              {course.description && (
                <p className="mb-4 text-sm text-gray-500 line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* Batch list */}
              {course.batches && course.batches.length > 0 && (
                <ul className="mb-4 space-y-1.5">
                  {course.batches.map((batch) => (
                    <li
                      key={batch.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {batch.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => openEditBatch(batch)}
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
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => openBatchModal(course.id)}
                className="w-full rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                + Add Batch
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title="Create Course"
      >
        <CourseForm
          onSuccess={() => {
            setShowCourseModal(false);
            refreshCourses();
          }}
          token={token}
        />
      </Modal>

      {/* Create Batch Modal */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setSelectedCourseId(null);
        }}
        title="Add Batch"
      >
        {selectedCourseId && (
          <BatchForm
            courseId={selectedCourseId}
            onSuccess={() => {
              setShowBatchModal(false);
              setSelectedCourseId(null);
              refreshCourses();
            }}
            token={token}
          />
        )}
      </Modal>

      {/* Edit Batch Modal */}
      <Modal
        isOpen={!!editingBatch}
        onClose={() => setEditingBatch(null)}
        title="Edit Batch"
      >
        {editingBatch && (
          <BatchForm
            courseId={editingBatch.course_id}
            batch={editingBatch}
            onSuccess={() => {
              setEditingBatch(null);
              refreshCourses();
            }}
            token={token}
          />
        )}
      </Modal>

      {/* Delete Batch Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBatch}
        title="Delete Batch"
        message={`Are you sure you want to delete "${deletingBatch?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteBatch}
        onCancel={() => setDeletingBatch(null)}
      />

      {/* Delete Course Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCourse}
        title="Archive Course"
        message={`Are you sure you want to archive "${deletingCourse?.name}"? It will be hidden from the dashboard.`}
        confirmLabel="Archive"
        onConfirm={confirmDeleteCourse}
        onCancel={() => setDeletingCourse(null)}
      />
    </>
  );
}
