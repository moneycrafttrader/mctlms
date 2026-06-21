'use client';

import { useState } from 'react';
import { Video, Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { type LiveSession, getSessionJoinUrl, requestJoinToken } from '@/lib/api/live-sessions';

interface NextSessionCardProps {
  sessions: LiveSession[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NextSessionCard({ sessions }: NextSessionCardProps) {
  const [joining, setJoining] = useState(false);

  // Filter scheduled/live, sorted by start_time ascending
  const upcoming = sessions
    .filter((s) => s.status === 'scheduled' || s.status === 'live')
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  const nextSession = upcoming[0];

  if (!nextSession) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2.5">
            <Video className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Next Session</h3>
            <p className="text-sm text-gray-400">No upcoming sessions scheduled.</p>
          </div>
        </div>
      </div>
    );
  }

  const isLive = nextSession.status === 'live';

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { token } = await requestJoinToken(nextSession.id);
      const { joinUrl } = await getSessionJoinUrl(nextSession.id, token);
      window.open(joinUrl, '_blank');
    } catch {
      // join URL failed — silent
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`rounded-lg p-2.5 shrink-0 ${
              isLive ? 'bg-green-100' : 'bg-brand-50'
            }`}
          >
            <Video
              className={`h-5 w-5 ${
                isLive ? 'text-green-600' : 'text-brand-600'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Next Session
              </h3>
              {isLive && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 animate-pulse">
                  Live Now
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-gray-900 truncate max-w-xs">
              {nextSession.topic}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(nextSession.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(nextSession.start_time)}
              </span>
              <span>{nextSession.duration_minutes} min</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {joining ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {joining
            ? 'Joining...'
            : isLive
              ? 'Join Now'
              : 'Join'}
        </button>
      </div>
    </div>
  );
}
