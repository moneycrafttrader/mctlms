'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllBatches } from '@/lib/api/courses';
import { ROUTES } from '@/lib/constants';
import type { Batch } from '@/lib/api/courses';

export default function TeacherBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAllBatches({ limit: 100 });
        if (!cancelled) setBatches(result.items ?? []);
      } catch {
        if (!cancelled) setBatches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My batches</h1>
        <p className="mt-1 text-sm text-text-muted">Batches you are assigned to teach</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
        </div>
      ) : batches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-border py-12 text-center text-sm text-text-muted">
          No batches assigned yet. Ask an admin to add you in Batch → Teachers.
        </p>
      ) : (
        <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-card">
          {batches.map((batch) => (
            <li key={batch.id}>
              <Link
                href={`${ROUTES.TEACHER.BATCHES}/${batch.id}`}
                className="block px-5 py-4 hover:bg-surface-muted/40"
              >
                <p className="font-medium text-text-primary">{batch.name}</p>
                {(batch as { course?: { name?: string } }).course?.name && (
                  <p className="mt-0.5 text-xs text-text-muted">
                    {(batch as { course?: { name?: string } }).course?.name}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}