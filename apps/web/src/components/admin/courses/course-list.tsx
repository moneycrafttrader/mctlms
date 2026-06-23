'use client';

import { useState, useCallback } from 'react';
import { Plus, BookOpen, Pencil, Trash2, Copy, Eye, ExternalLink, GraduationCap, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import { AdminSection } from '@/components/shared/AdminSection';
import { AdminStatCard } from '@/components/shared/AdminStatCard';
import { CourseForm } from './course-form';
import { BatchForm } from './batch-form';
import {
  type Course, type Batch, getCourses, deleteBatch, deleteCourse,
  duplicateCourse, activateCourse, updateCourse,
} from '@/lib/api/courses';

interface CourseListProps { initialCourses: Course[]; }

export function CourseList({ initialCourses }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activatingCourse, setActivatingCourse] = useState<Course | null>(null);

  const totalBatches = courses.reduce((s, c) => s + (c.batchCount ?? c.batches?.length ?? 0), 0);
  const activeCourses = courses.filter(c => c.is_active).length;
  const inactiveCourses = courses.filter(c => !c.is_active).length;

  const refresh = useCallback(async () => {
    try { const r = await getCourses(); setCourses(r.items); } catch { /* silent */ }
    try { await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/admin/courses' }) }); } catch { /* best-effort */ }
  }, []);

  const confirmDeleteBatch = async () => { if (!deletingBatch) return; try { await deleteBatch(deletingBatch.id); setDeletingBatch(null); refresh(); } catch { /* silent */ } };
  const confirmDeleteCourse = async () => { if (!deletingCourse) return; try { await deleteCourse(deletingCourse.id); setDeletingCourse(null); refresh(); } catch { /* silent */ } };
  const confirmActivate = async () => { if (!activatingCourse) return; try { await activateCourse(activatingCourse.id); setActivatingCourse(null); refresh(); } catch { /* silent */ } };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Courses & Batches" description="Manage your educational offerings" actions={
        <button onClick={() => setShowCourseModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" /> Create Course
        </button>
      } />

      <AdminSection title="Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminStatCard label="Total Courses" value={courses.length} icon={BookOpen} iconColor="bg-brand-50 text-brand-600" />
          <AdminStatCard label="Active" value={activeCourses} icon={GraduationCap} iconColor="bg-emerald-50 text-emerald-600" />
          <AdminStatCard label="Total Batches" value={totalBatches} icon={Users} iconColor="bg-blue-50 text-blue-600" />
        </div>
      </AdminSection>

      {courses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-surface-border py-20 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 text-sm font-semibold text-text-primary">No courses yet</p>
          <p className="mt-1 text-sm text-text-muted">Create your first course to get started.</p>
          <button onClick={() => setShowCourseModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">+ Create Course</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/courses/${course.id}`} className="text-lg font-semibold text-text-primary hover:text-brand-600 hover:underline">{course.name}</Link>
                  {course.description && <p className="mt-1 text-sm text-text-muted line-clamp-2">{course.description}</p>}
                </div>
                <span className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditingCourse(course)} className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-secondary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { duplicateCourse(course.id); refresh(); }} className="rounded p-1 text-text-muted hover:bg-blue-50 hover:text-blue-600" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                  {course.is_active
                    ? <button onClick={() => setDeletingCourse(course)} className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-red-600" title="Archive"><Trash2 className="h-3.5 w-3.5" /></button>
                    : <button onClick={() => setActivatingCourse(course)} className="rounded p-1 text-text-muted hover:bg-emerald-50 hover:text-emerald-600" title="Activate"><Eye className="h-3.5 w-3.5" /></button>
                  }
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${course.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{course.is_active ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
              {course.batches && course.batches.length > 0 && (
                <ul className="mb-4 space-y-1.5">
                  {course.batches.map((batch) => (
                    <li key={batch.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm">
                      <Link href={`/admin/batches/${batch.id}`} className="flex items-center gap-2 text-text-secondary hover:text-brand-600 flex-1 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                        <span className="truncate">{batch.name}</span>
                        <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />
                      </Link>
                      <span className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditingBatch(batch)} className="rounded p-1 text-text-muted hover:bg-surface-border hover:text-text-secondary"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => setDeletingBatch(batch)} className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => { setSelectedCourseId(course.id); setShowBatchModal(true); }} className="w-full rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors">+ Add Batch</button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Create Course"><CourseForm onSuccess={() => { setShowCourseModal(false); refresh(); }} /></Modal>
      <Modal isOpen={!!editingCourse} onClose={() => setEditingCourse(null)} title="Edit Course">{editingCourse && <CourseForm initialData={editingCourse} onSuccess={() => { setEditingCourse(null); refresh(); }} />}</Modal>
      <Modal isOpen={showBatchModal} onClose={() => { setShowBatchModal(false); setSelectedCourseId(null); }} title="Add Batch">{selectedCourseId && <BatchForm courseId={selectedCourseId} onSuccess={() => { setShowBatchModal(false); setSelectedCourseId(null); refresh(); }} />}</Modal>
      <Modal isOpen={!!editingBatch} onClose={() => setEditingBatch(null)} title="Edit Batch">{editingBatch && <BatchForm courseId={editingBatch.course_id} batch={editingBatch} onSuccess={() => { setEditingBatch(null); refresh(); }} />}</Modal>
      <ConfirmDialog isOpen={!!deletingBatch} title="Delete Batch" message={`Delete "${deletingBatch?.name}"?`} confirmLabel="Delete" onConfirm={confirmDeleteBatch} onCancel={() => setDeletingBatch(null)} />
      <ConfirmDialog isOpen={!!deletingCourse} title="Archive Course" message={`Archive "${deletingCourse?.name}"?`} confirmLabel="Archive" onConfirm={confirmDeleteCourse} onCancel={() => setDeletingCourse(null)} />
      <ConfirmDialog isOpen={!!activatingCourse} title="Activate Course" message={`Activate "${activatingCourse?.name}"?`} confirmLabel="Activate" onConfirm={confirmActivate} onCancel={() => setActivatingCourse(null)} />
    </div>
  );
}
