'use client';

import { ReactNode } from 'react';
import { useScreenRecordingDetection } from '@/lib/screen-recording/useScreenRecordingDetection';
import { ScreenRecordingInlineWarning } from './ScreenRecordingInlineWarning';
import { ScreenRecordingWarning } from './ScreenRecordingWarning';
import type { ContextType } from '@/lib/api/screen-recording';

interface Props {
  children?: ReactNode;
  contextType: ContextType;
  contextId?: string;
  enabled?: boolean;
  /** Show modal overlay instead of inline banner (default: inline) */
  modal?: boolean;
}

export function ScreenRecordingDetector({
  children,
  contextType,
  contextId,
  enabled = true,
  modal = false,
}: Props) {
  const { isWarningVisible, dismissWarning } = useScreenRecordingDetection({
    contextType,
    contextId,
    enabled,
  });

  return (
    <>
      {children}
      {modal ? (
        <ScreenRecordingWarning visible={isWarningVisible} onDismiss={dismissWarning} />
      ) : (
        <ScreenRecordingInlineWarning visible={isWarningVisible} onDismiss={dismissWarning} />
      )}
    </>
  );
}
