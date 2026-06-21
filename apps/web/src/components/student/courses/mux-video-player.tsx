'use client';

import MuxPlayer from '@mux/mux-player-react';
import { PlayCircle } from 'lucide-react';

interface MuxVideoPlayerProps {
  playbackUrl?: string;
  thumbnail?: string;
  title?: string;
}

export function MuxVideoPlayer({ playbackUrl, thumbnail, title }: MuxVideoPlayerProps) {
  if (!playbackUrl) {
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
        src={playbackUrl}
        poster={thumbnail || undefined}
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
