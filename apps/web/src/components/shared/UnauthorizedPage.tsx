'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <LogOut className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-text-primary">
          Session expired
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Please login again to continue.
        </p>
        <button
          onClick={() => router.push(ROUTES.LOGIN)}
          className="mt-6 w-full rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navyDark"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
