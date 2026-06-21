'use client';

import { useState } from 'react';
import { Video, Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { type LiveSession, getSessionJoinUrl } from '@/lib/api/live-sessions';
import { SessionStatusBadge } from '@/components/shared/SessionStatusBadge';

interface Props {
  session: LiveSession | null;
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
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function DashboardNextClass({ session, token }: Props) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!session) return;
    setJoining(true);
    try {
      const url = await getSessionJoinUrl(session.id, token);
      window.open(url, '_blank');
    } catch {
      // silent
    } finally {
      setJoining(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-card border border-surface-border bg-surface-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Next Class
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          No upcoming classes scheduled.
        </p>
      </div>
    );
  }

  const isLive = session.status === 'live';

  return (
    <div className="rounded-card border border-surface-border bg-surface-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {isLive ? 'Live Now' : 'Next Class'}
      </h3>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-text-primary truncate">
              {session.topic}
            </h4>
            <SessionStatusBadge status={session.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(session.start_time)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(session.start_time)}
            </span>
            <span>{session.duration_minutes} min</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleJoin}
        disabled={joining}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navyDark disabled:opacity-50 md:w-auto"
      >
        {joining ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            {isLive ? 'Join Now' : 'Join'}
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
