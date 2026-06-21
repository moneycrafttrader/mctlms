'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { reportScreenRecordingViolation, type ContextType, type DetectionType } from '@/lib/api/screen-recording';
import { SCREEN_RECORDING_DETECTION_ENABLED } from './feature-flag';

interface UseScreenRecordingDetectionOptions {
  contextType: ContextType;
  contextId?: string;
  enabled?: boolean;
}

interface UseScreenRecordingDetectionReturn {
  isWarningVisible: boolean;
  dismissWarning: () => void;
}

const DEVTOOLS_THROTTLE_MS = 5000;

export function useScreenRecordingDetection({
  contextType,
  contextId,
  enabled = true,
}: UseScreenRecordingDetectionOptions): UseScreenRecordingDetectionReturn {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const lastReportRef = useRef<Record<string, number>>({});
  const devtoolsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const report = useCallback(
    (detectionType: DetectionType, details?: Record<string, any>) => {
      const now = Date.now();
      const last = lastReportRef.current[detectionType] || 0;
      if (now - last < DEVTOOLS_THROTTLE_MS) return;
      lastReportRef.current[detectionType] = now;

      setIsWarningVisible(true);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => {
        setIsWarningVisible(false);
      }, 4000);

      reportScreenRecordingViolation(contextType, detectionType, contextId, details)
        .catch(() => {});
    },
    [contextType, contextId],
  );

  useEffect(() => {
    if (!enabled || !SCREEN_RECORDING_DETECTION_ENABLED) return;

    // ── 1. visibilitychange ──
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        report('visibilitychange_hidden', { visibilityState: document.visibilityState });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ── 2. window blur / focus loss ──
    const handleBlur = () => report('window_blur', { eventType: 'blur' });
    const handleFocus = () => {
      // focus regained after a blur — log as focus_lost at the next blur
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // ── 3. PrintScreen (PrntScrn) key ──
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        report('printscreen_key', { key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey });
      }
      // Ctrl+Shift+[IJC] — devtools shortcuts (best-effort)
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        report('devtools_open', { trigger: 'keyboard_shortcut', key: e.key });
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // ── 4. DevTools open detection (debugger statement trick) ──
    const detectDevTools = () => {
      const start = performance.now();
      debugger;
      const elapsed = performance.now() - start;
      if (elapsed > 100) {
        report('devtools_open', { method: 'debugger_check', elapsedMs: Math.round(elapsed) });
      }
    };
    devtoolsIntervalRef.current = setInterval(detectDevTools, 3000);

    // ── 5. getDisplayMedia ──
    const originalGetDisplayMedia = MediaDevices.prototype.getDisplayMedia;
    MediaDevices.prototype.getDisplayMedia = function (options?: DisplayMediaStreamOptions) {
      report('get_display_media', { method: 'getDisplayMedia' });
      return originalGetDisplayMedia.call(this, options);
    };

    // ── 6. Screen.orientation change — might indicate screen recording rotation ──
    // (low confidence, not reported by default)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
      if (devtoolsIntervalRef.current) clearInterval(devtoolsIntervalRef.current);
      MediaDevices.prototype.getDisplayMedia = originalGetDisplayMedia;
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [enabled, report]);

  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
  }, []);

  return { isWarningVisible, dismissWarning };
}
