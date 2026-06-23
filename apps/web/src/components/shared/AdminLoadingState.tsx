import { Loader2 } from 'lucide-react';

interface AdminLoadingStateProps {
  message?: string;
}

export function AdminLoadingState({ message = 'Loading...' }: AdminLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      <p className="mt-3 text-sm text-text-muted">{message}</p>
    </div>
  );
}
