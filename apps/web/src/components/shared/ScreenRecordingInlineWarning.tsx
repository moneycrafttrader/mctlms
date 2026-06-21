'use client';

import { AlertTriangle, X } from 'lucide-react';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function ScreenRecordingInlineWarning({ visible, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <div className="absolute left-4 right-4 top-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-lg border-2 border-red-400 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="flex-1 text-xs font-medium text-red-800 leading-relaxed">
            Recording course content is prohibited. This activity has been logged.
          </p>
          <button
            onClick={onDismiss}
            className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
