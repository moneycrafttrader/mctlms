'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, VideoOff } from 'lucide-react';
import { getZoomSignature } from '@/lib/api/zoom';
import type { ZoomSignatureResponse } from '@/lib/api/zoom';

interface ZoomWebinarPlayerProps {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail?: string;
  token?: string;
  onLeave?: () => void;
}

type PlayerState =
  | { phase: 'loading' }
  | { phase: 'initializing' }
  | { phase: 'joined' }
  | { phase: 'not_live' }
  | { phase: 'error'; message: string };

async function loadZoomSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://source.zoom.us/2.18.2/lib/zoom-meeting-2.18.2.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Zoom SDK'));
    document.head.appendChild(script);
  });
}

export function ZoomWebinarPlayer({
  meetingNumber,
  password,
  userName,
  userEmail,
  token,
  onLeave,
}: ZoomWebinarPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PlayerState>({ phase: 'loading' });
  const zoomClientRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const handleLeave = useCallback(() => {
    if (zoomClientRef.current) {
      try {
        zoomClientRef.current.leaveMeeting();
      } catch {}
    }
    onLeave?.();
  }, [onLeave]);

  useEffect(() => {
    mountedRef.current = true;

    let signatureData: ZoomSignatureResponse;

    const initZoom = async () => {
      try {
        setState({ phase: 'loading' });

        signatureData = await getZoomSignature(meetingNumber, 0, token);

        if (!mountedRef.current) return;

        setState({ phase: 'initializing' });

        await loadZoomSDK();

        if (!mountedRef.current) return;

        const { ZoomClient } = (window as any).ZoomMeetingSDK;
        const client = ZoomClient.createClient();
        zoomClientRef.current = client;

        if (!containerRef.current) return;

        await client.init({
          zoomAppRoot: containerRef.current,
          language: 'en-US',
          customize: {
            meetingInfo: ['topic', 'host', 'mn', 'pwd', 'invite', 'participant', 'dc', 'enctype'],
            video: {
              isResizable: false,
              viewSizes: {
                default: { width: 1280, height: 720 },
              },
            },
          },
        });

        if (!mountedRef.current) return;

        await client.join({
          sdkKey: signatureData.sdkKey,
          signature: signatureData.signature,
          meetingNumber,
          password,
          userName,
          userEmail,
        });

        if (!mountedRef.current) return;

        setState({ phase: 'joined' });
      } catch (err: any) {
        if (!mountedRef.current) return;

        if (err?.message?.includes('not live') || err?.message?.includes('Not live')) {
          setState({ phase: 'not_live' });
        } else {
          setState({ phase: 'error', message: err?.message || 'Failed to join session' });
        }
      }
    };

    initZoom();

    return () => {
      mountedRef.current = false;
      if (zoomClientRef.current) {
        try {
          zoomClientRef.current.leaveMeeting();
        } catch {}
        zoomClientRef.current = null;
      }
    };
  }, [meetingNumber, password, userName, userEmail, token]);

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
      {/* Zoom SDK renders inside this container */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden rounded-xl border bg-gray-900"
      />

      {/* Overlay for non-joined states */}
      {(state.phase !== 'joined') && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-gray-900/90 text-white">
          {state.phase === 'loading' && (
            <>
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-400" />
              <p className="text-sm font-medium">Preparing session...</p>
            </>
          )}

          {state.phase === 'initializing' && (
            <>
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-400" />
              <p className="text-sm font-medium">Connecting to session...</p>
            </>
          )}

          {state.phase === 'not_live' && (
            <>
              <VideoOff className="mb-3 h-10 w-10 text-yellow-400" />
              <p className="text-base font-semibold">Session Not Live</p>
              <p className="mt-1 text-sm text-gray-400">
                This session has not started yet. Please wait for the host to begin.
              </p>
            </>
          )}

          {state.phase === 'error' && (
            <>
              <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
              <p className="text-base font-semibold">Unable to Join</p>
              <p className="mt-1 max-w-sm text-center text-sm text-gray-400">
                {state.message}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
