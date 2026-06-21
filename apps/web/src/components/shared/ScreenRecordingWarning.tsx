'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function ScreenRecordingWarning({ visible, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  if (!visible && !mounted) return null;

  return (
    <div
      role="alert"
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onTransitionEnd={() => {
        if (!visible) setMounted(false);
      }}
    >
      <div className="mx-4 max-w-md rounded-xl border-2 border-red-400 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-red-800">
              Recording Detected
            </h3>
            <p className="mt-1 text-sm text-red-700 leading-relaxed">
              Recording course content is prohibited. This activity has been logged and may result in account suspension.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
