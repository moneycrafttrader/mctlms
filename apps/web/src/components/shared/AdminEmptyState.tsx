'use client';

import { AlertTriangle, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export function AdminEmptyState({
  icon: Icon = AlertTriangle,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  actionHref,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted ring-1 ring-surface-border">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-text-muted max-w-md">{description}</p>
      )}
      {(action || (actionLabel && actionHref)) && (
        <div className="mt-6">
          {action ?? (
            <Link
              href={actionHref!}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
