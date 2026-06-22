'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Calendar, ListVideo } from 'lucide-react';
import { CurriculumTab } from './curriculum-tab';
import { type Batch } from '@/lib/api/courses';

interface BatchDetailViewProps {
  batch: Batch & { course?: { id: string; name: string }; studentCount?: number; teacherCount?: number };
}

type Tab = 'students' | 'sessions' | 'curriculum';

export function BatchDetailView({ batch }: BatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('curriculum');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
    { key: 'sessions', label: 'Sessions', icon: <Calendar className="h-4 w-4" /> },
    { key: 'curriculum', label: 'Curriculum', icon: <ListVideo className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/batches"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
          <p className="text-sm text-gray-500">
            {batch.course?.name ?? 'Unknown Course'} &middot; {batch.schedule_type}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            Students
          </div>
          <p className="text-2xl font-bold text-gray-900">{batch.studentCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Sessions
          </div>
          <p className="text-2xl font-bold text-gray-900">-</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <BookOpen className="h-4 w-4" />
            Status
          </div>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${batch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {batch.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'students' && (
            <p className="text-gray-500">Student management coming soon.</p>
          )}
          {activeTab === 'sessions' && (
            <p className="text-gray-500">Session list coming soon.</p>
          )}
          {activeTab === 'curriculum' && <CurriculumTab batchId={batch.id} />}
        </div>
      </div>
    </div>
  );
}
