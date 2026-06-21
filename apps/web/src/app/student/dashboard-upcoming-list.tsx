'use client';

import { Calendar, Clock } from 'lucide-react';
import { type LiveSession } from '@/lib/api/live-sessions';

interface Props {
  sessions: LiveSession[];
  token?: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function DashboardUpcomingList({ sessions }: Props) {
  if (sessions.length === 0) return null;

  return (
    <div className="rounded-card border border-surface-border bg-surface-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Up Next
      </h3>
      <div className="mt-3 space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-muted p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <Calendar className="h-4 w-4 text-brand-navy" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">
                {session.topic}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                <span>{formatDate(session.start_time)}</span>
                <span>{formatTime(session.start_time)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
