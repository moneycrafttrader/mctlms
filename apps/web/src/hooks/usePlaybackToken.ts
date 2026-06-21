'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  authorizePlayback,
  getPlaybackUrl,
  reportPlaybackEvent,
} from '@/lib/api/playback';
import type { PlaybackUrlResponse } from '@/lib/api/playback';

interface UsePlaybackTokenOptions {
  recordingId: string;
  deviceId?: string;
  onError?: (error: string) => void;
}

interface UsePlaybackTokenReturn {
  playbackUrl: string | null;
  thumbnail: string | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
  reportEvent: (
    eventType: 'play' | 'pause' | 'seek' | 'ended' | 'heartbeat',
    positionSeconds?: number,
  ) => void;
  refreshUrl: () => Promise<void>;
}

export function usePlaybackToken({
  recordingId,
  deviceId,
  onError,
}: UsePlaybackTokenOptions): UsePlaybackTokenReturn {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const fetchUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tokenRef.current) {
        const auth = await authorizePlayback(recordingId, deviceId);
        tokenRef.current = auth.playbackToken;
        sessionIdRef.current = auth.sessionId;
      }

      const result = await getPlaybackUrl(
        recordingId,
        tokenRef.current,
        deviceId,
      );
      setPlaybackUrl(result.url);
      setThumbnail(result.thumbnail);
      setSessionId(result.sessionId);
      sessionIdRef.current = result.sessionId;
    } catch (err: any) {
      const msg = err?.message || 'Failed to load video';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [recordingId, deviceId, onError]);

  useEffect(() => {
    fetchUrl();
  }, [fetchUrl]);

  const reportEvent = useCallback(
    (eventType: 'play' | 'pause' | 'seek' | 'ended' | 'heartbeat', positionSeconds?: number) => {
      if (!sessionIdRef.current) return;
      reportPlaybackEvent(recordingId, eventType, positionSeconds, sessionIdRef.current)
        .catch(() => {});
    },
    [recordingId],
  );

  return {
    playbackUrl,
    thumbnail,
    sessionId,
    loading,
    error,
    reportEvent,
    refreshUrl: fetchUrl,
  };
}
