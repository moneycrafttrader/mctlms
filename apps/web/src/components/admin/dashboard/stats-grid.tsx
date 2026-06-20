'use client';

import { BookOpen, Users, IndianRupee, Calendar } from 'lucide-react';
import { type AdminOverview } from '@/lib/api/analytics';

interface StatsGridProps {
  data: AdminOverview;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const cards = [
  {
    label: 'Active Courses',
    key: 'activeCourses' as const,
    icon: BookOpen,
    color: 'text-blue-600 bg-blue-50',
    format: (v: number) => String(v),
  },
  {
    label: 'Students',
    key: 'studentCount' as const,
    icon: Users,
    color: 'text-green-600 bg-green-50',
    format: (v: number) => String(v),
  },
  {
    label: 'Total Revenue',
    key: 'totalRevenue' as const,
    icon: IndianRupee,
    color: 'text-purple-600 bg-purple-50',
    format: (v: number) => formatCurrency(v),
  },
  {
    label: 'Upcoming Sessions',
    key: 'upcomingSessions' as const,
    icon: Calendar,
    color: 'text-orange-600 bg-orange-50',
    format: (v: number, data?: AdminOverview) =>
      String(data?.upcomingSessions?.length ?? v),
  },
];

export function StatsGrid({ data }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const raw = data[card.key];
        const value =
          typeof raw === 'number'
            ? card.format(raw, data)
            : String(raw ?? '—');

        return (
          <div
            key={card.key}
            className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        );
      })}
    </div>
  );
}
