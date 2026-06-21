'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useWatermarkPositions } from '@/hooks/useWatermarkPositions';
import {
  WATERMARK_INSTANCES,
  POSITION_INTERVAL_MS,
  WATERMARK_OPACITY,
  WATERMARK_FONT_SIZE,
  TRAP_INSTANCES,
} from '@/lib/watermark/constants';

interface WatermarkOverlayProps {
  sessionId: string;
}

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function WatermarkOverlay({ sessionId }: WatermarkOverlayProps) {
  const user = useAuthStore((s) => s.user);
  const [timestamp, setTimestamp] = useState(formatTimestamp);

  useEffect(() => {
    const id = setInterval(() => setTimestamp(formatTimestamp()), 30_000);
    return () => clearInterval(id);
  }, []);

  const positions = useWatermarkPositions(
    WATERMARK_INSTANCES,
    TRAP_INSTANCES,
    POSITION_INTERVAL_MS,
  );

  const displayName = user?.name || user?.email?.split('@')[0] || 'Student';

  const line1 = `${displayName}  •  ${user?.email || ''}`;
  const line2 = `${timestamp}`;
  const line3 = `Session: ${sessionId.slice(0, 8)}...`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 select-none overflow-hidden"
      aria-hidden="true"
    >
      {positions.instances.map((pos, i) => (
        <div
          key={i}
          className="absolute whitespace-nowrap transition-all duration-1000 ease-in-out"
          style={{
            top: `${pos.top}%`,
            left: `${pos.left}%`,
            opacity: WATERMARK_OPACITY,
            fontSize: `${WATERMARK_FONT_SIZE}px`,
            lineHeight: '1.4',
            color: 'white',
            textShadow:
              '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.6)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.02em',
            transform: `rotate(${i % 2 === 0 ? -3 : 2}deg)`,
          }}
        >
          <div>{line1}</div>
          <div>{line2}</div>
          <div>{line3}</div>
        </div>
      ))}

      {positions.trap.map((pos, i) => (
        <div
          key={`trap-${i}`}
          className="absolute whitespace-nowrap"
          style={{
            top: `${pos.top}%`,
            left: `${pos.left}%`,
            opacity: '0.01',
            fontSize: `${WATERMARK_FONT_SIZE - 2}px`,
            lineHeight: '1.3',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 400,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          <div>{line1}</div>
          <div>{line2}</div>
          <div>{line3}</div>
        </div>
      ))}
    </div>
  );
}
