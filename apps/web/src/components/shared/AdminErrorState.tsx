'use client';

import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface AdminErrorStateProps {
  message?: string;
  details?: string;
  onRetry?: () => void;
  onReportIssue?: () => void;
}

export function AdminErrorState({
  message = 'Something went wrong while loading this data.',
  details,
  onRetry,
  onReportIssue,
}: AdminErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-text-primary">Failed to load</h3>
      <p className="mt-1.5 text-sm text-text-muted max-w-md">{message}</p>
      {details && (
        <p className="mt-2 text-xs text-text-muted max-w-lg font-mono bg-surface-muted rounded-lg p-3">{details}</p>
      )}
      <div className="mt-6 flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors"
          >
            <Bug className="h-4 w-4" />
            Report Issue
          </button>
        )}
      </div>
    </div>
  );
}
