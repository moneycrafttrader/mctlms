'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { type Batch, getAllBatches } from '@/lib/api/courses';

interface BatchListProps {
  initialBatches: Batch[];
  initialTotal: number;
}

export function BatchList({ initialBatches, initialTotal }: BatchListProps) {
  const [batches] = useState<Batch[]>(initialBatches);
  const [total] = useState(initialTotal);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
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
                    <Link
                      href={`/admin/batches/${batch.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      View Details
                    </Link>
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
    </div>
  );
}
