import { Search, Filter, X } from 'lucide-react';

interface AdminFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  onClear?: () => void;
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  onClear,
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-xl border border-surface-border bg-white pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none w-56"
        />
      </div>
      {children}
      {onClear && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2.5 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
