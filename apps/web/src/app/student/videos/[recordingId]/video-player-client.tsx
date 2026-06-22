'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import Hls from 'hls.js';
import { usePlaybackToken } from '@/hooks/usePlaybackToken';
import { WatermarkOverlay } from '@/components/shared/WatermarkOverlay';
import { ScreenRecordingDetector } from '@/components/shared/ScreenRecordingDetector';

interface Props {
  recordingId: string;
  sessionId: string;
  title: string;
  date: string;
}

export function VideoPlayerClient({ recordingId, sessionId, title, date }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportRef = useRef(0);
  const hlsRef = useRef<Hls | null>(null);

  const {
    playbackUrl,
    thumbnail,
    loading,
    error,
    reportEvent,
    refreshUrl,
  } = usePlaybackToken({
    recordingId,
    deviceId: undefined,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!playbackUrl || !video) return;

    const isSafari = typeof window !== 'undefined' && (
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    );

    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackUrl;
    } else if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
    } else {
      video.src = playbackUrl;
    }

    video.load();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl]);

  const handlePlay = useCallback(() => {
    reportEvent('play', videoRef.current?.currentTime);
  }, [reportEvent]);

  const handlePause = useCallback(() => {
    reportEvent('pause', videoRef.current?.currentTime);
  }, [reportEvent]);

  const handleSeeked = useCallback(() => {
    reportEvent('seek', videoRef.current?.currentTime);
  }, [reportEvent]);

  const handleEnded = useCallback(() => {
    reportEvent('ended', videoRef.current?.currentTime);
  }, [reportEvent]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.addEventListener('play', handlePlay);
    el.addEventListener('pause', handlePause);
    el.addEventListener('seeked', handleSeeked);
    el.addEventListener('ended', handleEnded);
    return () => {
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('pause', handlePause);
      el.removeEventListener('seeked', handleSeeked);
      el.removeEventListener('ended', handleEnded);
    };
  }, [handlePlay, handlePause, handleSeeked, handleEnded]);

  // Heartbeat every 30s for progress + analytics
  useEffect(() => {
    if (!playbackUrl) return;
    const id = setInterval(() => {
      const now = videoRef.current?.currentTime || 0;
      if (Math.abs(now - lastReportRef.current) > 1) {
        reportEvent('heartbeat', now);
        lastReportRef.current = now;
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [playbackUrl, reportEvent]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-text-primary">Unable to load video</h2>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
          <button
            onClick={refreshUrl}
            className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navyDark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenRecordingDetector
        contextType="recording"
        contextId={recordingId}
      >
        <div className="relative aspect-video w-full bg-black">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          <video
            ref={videoRef}
            controls
            autoPlay
            className="h-full w-full"
            poster={thumbnail || undefined}
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={handleContextMenu}
          >
            {playbackUrl && <source src={playbackUrl} type="application/x-mpegURL" />}
            Your browser does not support video playback.
          </video>
          <WatermarkOverlay sessionId={sessionId} />
        </div>
      </ScreenRecordingDetector>
      <div className="space-y-1 px-4 py-4 md:px-0">
        <h2 className="text-base font-bold text-text-primary">
          {title || 'Recording'}
        </h2>
        {date && (
          <p className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Calendar className="h-4 w-4" />
            {date}
          </p>
        )}
      </div>
    </div>
  );
}
