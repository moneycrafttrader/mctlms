'use client';

import { useState } from 'react';
import { AlertTriangle, XCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { type BulkUploadJob } from '@/lib/api/bulk-upload';

interface JobsHistoryProps {
  jobs: BulkUploadJob[];
}

const statusConfig: Record<string, { icon: any; class: string }> = {
  processing: { icon: Clock, class: 'bg-yellow-100 text-yellow-700' },
  completed: { icon: CheckCircle, class: 'bg-green-100 text-green-700' },
  failed: { icon: XCircle, class: 'bg-red-100 text-red-700' },
};

export function JobsHistory({ jobs }: JobsHistoryProps) {
  const [showFailures, setShowFailures] = useState<BulkUploadJob | null>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Upload History</h2>
      </div>

      {jobs.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p>No uploads yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">File</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Success</th>
                <th className="px-6 py-3">Failures</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const cfg = statusConfig[job.status] ?? statusConfig.failed;
                const StatusIcon = cfg.icon;

                return (
                  <tr
                    key={job.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="max-w-[180px] truncate px-6 py-4 font-medium text-gray-900">
                      {job.file_name}
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">
                      {job.job_type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.class}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-green-600">
                      {job.success_count}
                    </td>
                    <td className="px-6 py-4 text-red-600">
                      {job.failure_count}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(job.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(job.failures?.length ?? 0) > 0 && (
                        <button
                          onClick={() => setShowFailures(job)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <Eye className="h-3 w-3" />
                          View Errors
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Failure details modal */}
      <Modal
        isOpen={!!showFailures}
        onClose={() => setShowFailures(null)}
        title="Upload Failure Details"
      >
        {showFailures && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              <strong className="text-gray-700">{showFailures.file_name}</strong> —{' '}
              {showFailures.failure_count} failure(s) out of{' '}
              {showFailures.total_rows} row(s)
            </p>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {showFailures.failures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">{f.email}</p>
                    <p className="text-red-600">{f.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
