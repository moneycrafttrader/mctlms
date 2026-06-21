'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { ROUTES } from '@/lib/constants';
import { LogOut, AlertTriangle } from 'lucide-react';

export function SessionExpiredOverlay() {
  const { isExpired, isTakeover, error, logout } = useSession();
  const router = useRouter();

  if (!isExpired && !isTakeover) return null;

  const isTakeoverActive = isTakeover;
  const title = isTakeoverActive ? 'Session taken over' : 'Session expired';
  const description = error || (isTakeoverActive
    ? 'Another device logged into your account.'
    : 'Please login again.');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isTakeoverActive ? 'bg-orange-50' : 'bg-red-50'}`}>
          {isTakeoverActive ? (
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          ) : (
            <LogOut className="h-6 w-6 text-red-500" />
          )}
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        <button
          onClick={() => {
            logout();
            router.push(ROUTES.LOGIN);
          }}
          className="mt-6 w-full rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navyDark"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
