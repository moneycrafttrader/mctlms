'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ZoomWebinarPlayer } from '@/components/student/zoom-webinar-player';
import { WatermarkOverlay } from '@/components/shared/WatermarkOverlay';
import { ScreenRecordingDetector } from '@/components/shared/ScreenRecordingDetector';
import { getSessionJoinUrl, requestJoinToken } from '@/lib/api/live-sessions';
import type { LiveSessionWithDetails } from '@/lib/api/live-sessions';

interface Props {
  session: LiveSessionWithDetails;
}

export function LiveSessionClient({ session }: Props) {
  const user = useAuthStore((s) => s.user);
  const [liveSessionId] = useState(() => crypto.randomUUID());
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const isLive = session.status === 'live';

  useEffect(() => {
    if (!session.zoom_webinar_id || !isLive) return;
    let cancelled = false;
    requestJoinToken(session.id).then(() => {
      if (!cancelled) setTokenValidated(true);
    }).catch(() => {
      if (!cancelled) setTokenError(true);
    });
    return () => { cancelled = true; };
  }, [session.id, session.zoom_webinar_id, isLive]);

  if (session.zoom_webinar_id && isLive) {
    if (tokenError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-300 py-16 text-red-500">
          <p className="text-lg font-medium">Unable to verify access</p>
          <p className="mt-1 text-sm">You may not be registered for this session.</p>
        </div>
      );
    }

    return (
      <div className="relative mx-auto max-w-4xl">
        <ScreenRecordingDetector
          contextType="live_session"
          contextId={session.id}
        >
          {tokenValidated ? (
            <ZoomWebinarPlayer
              meetingNumber={session.zoom_webinar_id}
              password={undefined}
              userName={user?.name || user?.email || 'Student'}
              userEmail={user?.email}
            />
          ) : (
            <div className="flex items-center justify-center rounded-xl bg-gray-900 py-24 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
            </div>
          )}
        </ScreenRecordingDetector>
        <WatermarkOverlay sessionId={liveSessionId} />
      </div>
    );
  }

  return <SessionJoinFallback session={session} />;
}

function SessionJoinFallback({ session }: { session: LiveSessionWithDetails }) {
  const [joining, setJoining] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [liveSessionId] = useState(() => crypto.randomUUID());
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestJoinToken(session.id).then((res) => {
      if (!cancelled) setToken(res.token);
    }).catch(() => {
      if (!cancelled) setTokenError(true);
    });
    return () => { cancelled = true; };
  }, [session.id]);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    try {
      const { joinUrl } = await getSessionJoinUrl(session.id, token);
      window.open(joinUrl, '_blank');
    } catch {
      setJoining(false);
    }
  };

  const isUpcoming = session.status === 'scheduled' || session.status === 'live';

  if (!isUpcoming) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <p className="text-lg font-medium">Session has ended</p>
        <p className="mt-1 text-sm">This session is no longer available.</p>
      </div>
    );
  }

  return (
    <ScreenRecordingDetector
      contextType="live_session"
      contextId={session.id}
    >
      <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <p className="text-lg font-medium">{session.topic}</p>
        <p className="mt-1 mb-6 text-sm">
          {new Date(session.start_time).toLocaleString('en-IN')}
        </p>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {joining ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {joining ? 'Opening Zoom...' : 'Join on Zoom'}
        </button>
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden rounded-xl">
          <WatermarkOverlay sessionId={liveSessionId} />
        </div>
      </div>
    </ScreenRecordingDetector>
  );
}
