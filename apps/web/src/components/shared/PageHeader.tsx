'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showBack, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-surface-border bg-white md:static md:border-0 md:bg-transparent">
      <div className="flex h-12 items-center gap-3 px-4 md:h-auto md:px-0 md:pb-6 md:pt-0">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="mr-1 flex items-center justify-center rounded-lg p-1 text-text-secondary hover:bg-surface-muted md:hidden"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-base font-semibold text-text-primary md:text-2xl md:font-bold">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-secondary md:mt-1 md:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
