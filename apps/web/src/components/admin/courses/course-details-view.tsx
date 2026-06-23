'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  IndianRupee,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { AdminWorkspaceHeader } from '@/components/shared/AdminWorkspaceHeader';
import { AdminSection } from '@/components/shared/AdminSection';
import { AdminStatCard } from '@/components/shared/AdminStatCard';
import { ReassignBatchForm } from './reassign-batch-form';
import { BatchStudentsModal } from './batch-students-modal';
import { cn } from '@/lib/utils';
import {
  type CourseStats,
  type Batch,
  type Course,
  type StudentProfile,
  getCourseBatches,
  getCourseStats,
  getBatchStudents,
} from '@/lib/api/courses';

interface CourseDetailsViewProps {
  courseId: string;
  courseName: string;
  courseDescription?: string;
  isActive: boolean;
  createdAt: string;
  initialStats: CourseStats;
  initialBatches: Batch[];
  allCourses: Course[];
}

type Tab = 'overview' | 'batches' | 'students' | 'curriculum';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'batches', label: 'Batches', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
  { key: 'curriculum', label: 'Curriculum', icon: <ClipboardList className="h-4 w-4" /> },
];

export function CourseDetailsView({
  courseId,
  courseName,
  courseDescription,
  isActive,
  createdAt,
  initialStats,
  initialBatches,
  allCourses,
}: CourseDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<CourseStats>(initialStats);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);

  // Batch action state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [batchForReassign, setBatchForReassign] = useState<{ id: string; name: string } | null>(null);
  const [studentsBatch, setStudentsBatch] = useState<{ id: string; name: string } | null>(null);

  // Students tab state
  const [allStudents, setAllStudents] = useState<(StudentProfile & { batchName: string })[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [newStats, newBatches] = await Promise.all([
        getCourseStats(courseId),
        getCourseBatches(courseId),
      ]);
      setStats(newStats);
      setBatches(newBatches);
      setAllStudents(null); // invalidate student cache
    } catch { /* silent */ }
  }, [courseId]);

  const loadStudents = useCallback(async () => {
    if (allStudents) return;
    setLoadingStudents(true);
    try {
      const studentsMap: (StudentProfile & { batchName: string })[] = [];
      for (const batch of batches) {
        const { items } = await getBatchStudents(batch.id);
        for (const s of items) {
          studentsMap.push({ ...s, batchName: batch.name });
        }
      }
      setAllStudents(studentsMap);
    } catch { /* silent */ }
    finally { setLoadingStudents(false); }
  }, [batches, allStudents]);

  const openReassignModal = (batch: Batch) => {
    setBatchForReassign({ id: batch.id, name: batch.name });
    setShowReassignModal(true);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <AdminWorkspaceHeader
        title={courseName}
        subtitle={courseDescription ?? undefined}
        backHref="/admin/courses"
        badges={[
          { label: isActive ? 'Active' : 'Inactive', variant: isActive ? 'active' : 'inactive' },
        ]}
        context={[
          { label: 'Batches', value: String(stats.batchCount) },
          { label: 'Students', value: String(stats.studentCount) },
          { label: 'Created', value: formatDate(createdAt) },
        ]}
        actions={
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      {/* Tab Navigation */}
      <div className="border-b border-surface-border">
        <nav className="-mb-px flex gap-0" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key === 'students') loadStudents(); }}
              className={cn(
                'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-surface-border',
              )}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <AdminSection title="Stats at a Glance">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <AdminStatCard label="Total Students" value={stats.studentCount} icon={Users} iconColor="bg-brand-50 text-brand-600" />
                <AdminStatCard label="Active Batches" value={stats.batchCount} icon={BookOpen} iconColor="bg-blue-50 text-blue-600" />
                <AdminStatCard label="Upcoming Sessions" value={stats.upcomingSessions} icon={Calendar} iconColor="bg-purple-50 text-purple-600" />
              </div>
            </AdminSection>

            <AdminSection title="Batches" actions={
              <span className="text-xs text-text-muted">{batches.length} total</span>
            }>
              {batches.length === 0 ? (
                <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-text-muted" />
                  <p className="mt-2 text-sm text-text-secondary">No batches in this course yet.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-muted">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Batch Name</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Schedule</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {batches.slice(0, 5).map((batch) => (
                        <tr key={batch.id} className="hover:bg-surface-muted/50">
                          <td className="px-5 py-3.5 font-medium text-text-primary">{batch.name}</td>
                          <td className="px-5 py-3.5 capitalize text-text-secondary text-xs">{batch.schedule_type || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium border', batch.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                              {batch.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminSection>
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="space-y-4">
            {batches.length === 0 ? (
              <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-text-muted" />
                <h3 className="mt-3 text-sm font-semibold text-text-primary">No batches yet</h3>
                <p className="mt-1 text-sm text-text-muted">Create a batch to start adding students.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Schedule</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-surface-muted/50">
                        <td className="px-5 py-3.5 font-medium text-text-primary">{batch.name}</td>
                        <td className="px-5 py-3.5 capitalize text-text-secondary text-xs">{batch.schedule_type || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium border', batch.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                            {batch.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setStudentsBatch({ id: batch.id, name: batch.name })} className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted transition-colors">
                              Students
                            </button>
                            <button onClick={() => openReassignModal(batch)} className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted transition-colors">
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">{allStudents?.length ?? 0} students across {batches.length} batches</p>
              <button onClick={loadStudents} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
            {loadingStudents ? (
              <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-surface-border border-t-brand-500" />
                <p className="mt-3 text-sm text-text-muted">Loading students...</p>
              </div>
            ) : !allStudents || allStudents.length === 0 ? (
              <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-text-muted" />
                <h3 className="mt-3 text-sm font-semibold text-text-primary">No students enrolled</h3>
                <p className="mt-1 text-sm text-text-muted">Students will appear here once enrolled in a batch.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-muted">Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {allStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-muted/50">
                        <td className="px-5 py-3.5 font-medium text-text-primary">{s.name}</td>
                        <td className="px-5 py-3.5 text-text-secondary text-xs">{s.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex rounded-full bg-surface-muted border border-surface-border px-2 py-0.5 text-xs font-medium text-text-secondary">{s.batchName}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Curriculum Tab */}
        {activeTab === 'curriculum' && (
          <AdminSection title="Curriculum Overview">
            <p className="text-sm text-text-muted">
              Curriculum is managed at the batch level. Select a batch below to view its curriculum.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {batches.map((batch) => (
                <a
                  key={batch.id}
                  href={`/admin/batches/${batch.id}`}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-card p-4 hover:border-brand-200 hover:shadow-card-hover transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <BookOpen className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{batch.name}</p>
                    <p className="text-xs text-text-muted">{batch.schedule_type || 'No schedule'}</p>
                  </div>
                </a>
              ))}
            </div>
          </AdminSection>
        )}
      </div>

      {/* Batch Students Modal */}
      <BatchStudentsModal
        isOpen={!!studentsBatch}
        batchId={studentsBatch?.id ?? ''}
        batchName={studentsBatch?.name ?? ''}
        onClose={() => setStudentsBatch(null)}
      />

      {/* Reassign Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => { setShowReassignModal(false); setBatchForReassign(null); }}
        title="Reassign Batch"
      >
        {batchForReassign && (
          <ReassignBatchForm
            batchId={batchForReassign.id}
            batchName={batchForReassign.name}
            currentCourseId={courseId}
            courses={allCourses}
            onSuccess={() => {
              setShowReassignModal(false);
              setBatchForReassign(null);
              refresh();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
