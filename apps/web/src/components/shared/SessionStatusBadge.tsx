import { cn } from '@/lib/utils';

interface SessionStatusBadgeProps {
  status: string;
  className?: string;
}

const variantMap: Record<string, string> = {
  live: 'bg-red-100 text-status-live border border-red-200',
  scheduled: 'bg-blue-100 text-status-scheduled border border-blue-200',
  ended: 'bg-gray-100 text-status-ended border border-gray-200',
  cancelled: 'bg-gray-100 text-status-ended border border-gray-200',
};

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const variant = variantMap[status] || variantMap.ended;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant,
        className,
      )}
    >
      {status === 'live' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-live" />
      )}
      {status === 'live' ? 'LIVE' : status === 'scheduled' ? 'Scheduled' : status === 'ended' ? 'Ended' : status}
    </span>
  );
}
