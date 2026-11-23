'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ClipboardCheck, ArrowRight, Radio, Calendar } from 'lucide-react';
import { getAllBatches, getBatchStudents } from '@/lib/api/courses';
import { getReviewQueue } from '@/lib/api/assessments';
import { listLiveSessions } from '@/lib/api/live-sessions';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import type { Batch } from '@/lib/api/courses';

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAllBatches({ isActive: true, limit: 50 });
        const list = result.items ?? [];
        if (cancelled) return;
        setBatches(list);

        let students = 0;
        for (const b of list.slice(0, 10)) {
          try {
            const roster = await getBatchStudents(b.id, 1, 1);
            students += roster.total ?? 0;
          } catch {
            /* skip batch */
          }
        }
        if (!cancelled) setStudentTotal(students);

        const [reviews, sessions] = await Promise.all([
          getReviewQueue({ status: 'pending', limit: 1 }).catch(() => null),
          listLiveSessions({ limit: 50 }).catch(() => null),
        ]);
        if (cancelled) return;
        if (reviews) {
          const r = reviews as { total?: number; items?: unknown[] };
          setPendingReviews(r.total ?? r.items?.length ?? 0);
        }
        const now = Date.now();
        const up =
          sessions?.items?.filter(
            (s) => s.status !== 'ended' && s.status !== 'cancelled' && new Date(s.start_time).getTime() >= now - 86_400_000,
          ).length ?? 0;
        setUpcomingSessions(up);
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

  const firstName = user?.name?.split(' ')[0] || 'Teacher';

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-text-muted">Your assigned batches and pending work.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Assigned batches" value={loading ? '…' : String(batches.length)} />
        <MetricCard label="Students (sampled)" value={loading ? '…' : String(studentTotal)} />
        <MetricCard label="Upcoming sessions" value={loading ? '…' : String(upcomingSessions)} />
        <MetricCard
          label="Pending reviews"
          value={loading ? '…' : pendingReviews == null ? '—' : String(pendingReviews)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={ROUTES.TEACHER.BATCHES}
          className="group rounded-xl border border-surface-border bg-surface-card p-5 transition-shadow hover:shadow-card"
        >
          <div className="flex items-start justify-between">
            <Users className="h-8 w-8 text-brand-navy" />
            <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-text-primary">My batches</p>
          <p className="mt-1 text-sm text-text-muted">Roster, curriculum, and batch sessions</p>
        </Link>

        <Link
          href={ROUTES.TEACHER.LIVE_SESSIONS}
          className="group rounded-xl border border-surface-border bg-surface-card p-5 transition-shadow hover:shadow-card"
        >
          <div className="flex items-start justify-between">
            <Radio className="h-8 w-8 text-brand-navy" />
            <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-text-primary">Live sessions</p>
          <p className="mt-1 text-sm text-text-muted">Upcoming and past class meetings</p>
        </Link>

        <Link
          href={ROUTES.TEACHER.REVIEW_QUEUE}
          className="group rounded-xl border border-surface-border bg-surface-card p-5 transition-shadow hover:shadow-card sm:col-span-2"
        >
          <div className="flex items-start justify-between">
            <ClipboardCheck className="h-8 w-8 text-brand-navy" />
            <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-lg font-semibold text-text-primary">Review queue</p>
          <p className="mt-1 text-sm text-text-muted">Grade subjective answers for your students</p>
        </Link>
      </div>

      {!loading && batches.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            <Calendar className="h-4 w-4" />
            Your batches
          </h2>
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-card">
            {batches.slice(0, 8).map((batch) => (
              <li key={batch.id}>
                <Link
                  href={`${ROUTES.TEACHER.BATCHES}/${batch.id}`}
                  className="flex min-h-[44px] items-center justify-between px-4 py-3 text-sm hover:bg-surface-muted/50"
                >
                  <span className="font-medium text-text-primary">{batch.name}</span>
                  <ArrowRight className="h-4 w-4 text-text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}