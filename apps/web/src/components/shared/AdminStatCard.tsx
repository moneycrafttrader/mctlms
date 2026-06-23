import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
  className?: string;
}

export function AdminStatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor = 'bg-brand-50 text-brand-600',
  trend,
  onClick,
  className,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-border bg-surface-card p-5 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-brand-200 hover:shadow-card-hover',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {sublabel && (
            <p className="text-xs text-text-muted">{sublabel}</p>
          )}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.positive ? 'text-status-success' : 'text-status-error',
              )}
            >
              <span>{trend.positive ? '↑' : '↓'} {trend.value}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
