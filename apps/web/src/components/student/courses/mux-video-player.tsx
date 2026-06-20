/*
 * MuxVideoPlayer — wraps @mux/mux-player-react with a placeholder state
 *
 * Displays a full-width Mux video player when a playbackId is provided,
 * or a centered placeholder prompt when no video is selected.
 */
'use client';

import MuxPlayer from '@mux/mux-player-react';
import { PlayCircle } from 'lucide-react';

interface MuxVideoPlayerProps {
  playbackId?: string;
  title?: string;
}

export function MuxVideoPlayer({ playbackId, title }: MuxVideoPlayerProps) {
  if (!playbackId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 shadow-lg">
        <PlayCircle className="mb-4 h-16 w-16 opacity-50" />
        <p className="text-lg font-medium">Select a video from the library to begin</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg border border-gray-200">
      <MuxPlayer
        streamType="on-demand"
        playbackId={playbackId}
        metadata={{
          video_title: title || 'Course Video',
        }}
        primaryColor="#2563eb"
        secondaryColor="#ffffff"
        style={{ height: '100%', width: '100%', maxWidth: '100%' }}
      />
    </div>
  );
}
