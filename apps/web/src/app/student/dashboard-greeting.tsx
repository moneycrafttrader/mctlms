'use client';

import { useEffect, useState } from 'react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function DashboardGreeting() {
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
    setDateStr(formatDate());
  }, []);

  return (
    <div className="rounded-card bg-brand-navy p-5 text-white">
      <h2 className="text-lg font-bold">{greeting} 👋</h2>
      <p className="mt-1 text-sm text-white/70">{dateStr}</p>
    </div>
  );
}
