'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Users, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { ReassignBatchForm } from './reassign-batch-form';
import { BatchStudentsModal } from './batch-students-modal';
import {
  type CourseStats,
  type Batch,
  type Course,
  getCourseBatches,
  getCourseStats,
} from '@/lib/api/courses';

interface CourseDetailsViewProps {
  courseId: string;
  courseName: string;
  initialStats: CourseStats;
  initialBatches: Batch[];
  allCourses: Course[];
}

export function CourseDetailsView({
  courseId,
  courseName,
  initialStats,
  initialBatches,
  allCourses,
}: CourseDetailsViewProps) {
  const [stats, setStats] = useState<CourseStats>(initialStats);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [batchForReassign, setBatchForReassign] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [studentsBatch, setStudentsBatch] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [newStats, newBatches] = await Promise.all([
        getCourseStats(courseId),
        getCourseBatches(courseId),
      ]);
      setStats(newStats);
      setBatches(newBatches);
    } catch {
      // silent
    }
  }, [courseId]);

  const openReassignModal = (batch: Batch) => {
    setBatchForReassign({ id: batch.id, name: batch.name });
    setShowReassignModal(true);
  };

  const statCards = [
    { label: 'Total Students', value: stats.studentCount, icon: Users },
    { label: 'Active Batches', value: stats.batchCount, icon: BookOpen },
    { label: 'Upcoming Sessions', value: stats.upcomingSessions, icon: Calendar },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{courseName}</h1>
          <p className="text-sm text-gray-500">Course details &amp; batch management</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <stat.icon className="h-4 w-4" />
              {stat.label}
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Batches table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Batches ({batches.length})
          </h2>
        </div>

        {batches.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p>No batches assigned to this course yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Batch Name</th>
                  <th className="px-6 py-3">Schedule</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {batch.name}
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">
                      {batch.schedule_type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          batch.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {batch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setStudentsBatch({ id: batch.id, name: batch.name })}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Students
                        </button>
                        <button
                          onClick={() => openReassignModal(batch)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Reassign Course
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
        onClose={() => {
          setShowReassignModal(false);
          setBatchForReassign(null);
        }}
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
