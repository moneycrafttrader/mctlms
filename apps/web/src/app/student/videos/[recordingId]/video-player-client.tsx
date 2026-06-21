'use client';

import { Calendar } from 'lucide-react';

interface Props {
  playbackUrl: string;
  thumbnail: string;
  title: string;
  date: string;
}

export function VideoPlayerClient({ playbackUrl, thumbnail, title, date }: Props) {
  return (
    <div>
      <div className="aspect-video w-full bg-black">
        <video
          controls
          autoPlay
          className="h-full w-full"
          poster={thumbnail || undefined}
        >
          <source src={playbackUrl} type="application/x-mpegURL" />
          Your browser does not support video playback.
        </video>
      </div>
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
