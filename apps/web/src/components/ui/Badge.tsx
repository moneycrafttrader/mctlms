interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: string;
}

export function Badge({ variant = 'info', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
