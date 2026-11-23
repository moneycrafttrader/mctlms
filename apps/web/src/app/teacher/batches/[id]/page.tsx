'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ClipboardList, Users } from 'lucide-react';
import { getBatch, getBatchStudents } from '@/lib/api/courses';
import { ROUTES } from '@/lib/constants';
import { TeacherCurriculumPanel } from '@/components/teacher/TeacherCurriculumPanel';
import { TeacherSessionsPanel } from '@/components/teacher/TeacherSessionsPanel';
import { cn } from '@/lib/utils';

type Tab = 'roster' | 'curriculum' | 'sessions';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'roster', label: 'Roster', icon: Users },
  { key: 'curriculum', label: 'Curriculum', icon: ClipboardList },
  { key: 'sessions', label: 'Live sessions', icon: Calendar },
];

export default function TeacherBatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const [batchName, setBatchName] = useState('');
  const [students, setStudents] = useState<{ name?: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('roster');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [batch, roster] = await Promise.all([
          getBatch(batchId),
          getBatchStudents(batchId, 1, 100),
        ]);
        if (cancelled) return;
        setBatchName(batch.name);
        setStudents(roster.items ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load batch');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.TEACHER.BATCHES} className="text-sm text-brand-navy hover:underline">
          ← Back to batches
        </Link>
        <p className="text-sm text-status-error" role="alert">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Link href={ROUTES.TEACHER.BATCHES} className="inline-block text-sm text-brand-navy hover:underline">
        ← My batches
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{batchName}</h1>
        <p className="mt-1 text-sm text-text-muted">{students.length} students enrolled</p>
      </div>

      <div className="border-b border-surface-border">
        <nav className="-mb-px flex gap-0 overflow-x-auto" role="tablist" aria-label="Batch sections">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex min-h-[44px] shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium',
                  active ? 'border-brand-600 text-brand-600' : 'border-transparent text-text-muted',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === 'roster' && (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {students.map((s, i) => (
                <tr key={s.email ?? i}>
                  <td className="px-4 py-3 text-text-primary">{s.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'curriculum' && <TeacherCurriculumPanel batchId={batchId} />}
      {tab === 'sessions' && <TeacherSessionsPanel batchId={batchId} />}
    </div>
  );
}