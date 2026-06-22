'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary:${this.props.name || 'unknown'}]`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <CrashReport
        name={this.props.name || 'unknown'}
        error={this.state.error!}
        errorInfo={this.state.errorInfo!}
        onReset={() => this.setState({ hasError: false, error: null, errorInfo: null })}
      />;
    }

    return this.props.children;
  }
}

function CrashReport({
  name,
  error,
  errorInfo,
  onReset,
}: {
  name: string;
  error: Error;
  errorInfo: ErrorInfo;
  onReset: () => void;
}) {
  const stackLines = (error.stack || '').split('\n').slice(0, 8).join('\n');
  const componentStackLines = (errorInfo.componentStack || '')
    .split('\n')
    .slice(0, 6)
    .join('\n');

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-surface-page p-4">
      <div className="w-full max-w-lg rounded-card border border-status-error/30 bg-surface-card shadow-modal">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-surface-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-status-error" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Component Crash</h2>
            <p className="text-xs text-text-muted font-mono">{name}</p>
          </div>
        </div>

        {/* Error details */}
        <div className="space-y-3 px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Error</p>
            <pre className="rounded-lg bg-red-50 p-3 text-xs text-status-error font-mono whitespace-pre-wrap break-all">
              {error.message}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Stack</p>
            <pre className="rounded-lg bg-surface-muted p-3 text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {stackLines || 'No stack trace'}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Component Stack</p>
            <pre className="rounded-lg bg-surface-muted p-3 text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {componentStackLines || 'No component stack'}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-surface-border px-6 py-4">
          <button
            onClick={() => {
              const text = [
                `Error in ${name}:`,
                error.message,
                '',
                'Stack:',
                error.stack,
                '',
                'Component Stack:',
                errorInfo.componentStack,
              ].join('\n');
              navigator.clipboard.writeText(text);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Report
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 ml-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
