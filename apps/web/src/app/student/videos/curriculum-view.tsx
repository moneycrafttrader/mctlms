'use client';

import Link from 'next/link';
import { PlayCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { StudentVideo, StudentCurriculumCategory } from '@/lib/api/videos';

interface Props {
  batchName: string;
  categories: StudentCurriculumCategory[];
  recordings: StudentVideo[];
}

function recordingProgress(recordingId: string, recordings: StudentVideo[]) {
  const match = recordings.find((r) => r.id === recordingId);
  if (!match) return null;
  return match.progress;
}

export function CurriculumView({ batchName, categories, recordings }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-gray-900">{batchName}</h2>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.category} className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
            <button
              onClick={() => toggle(cat.category)}
              className="flex w-full items-center gap-2 bg-surface-muted px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {collapsed.has(cat.category) ? (
                <ChevronRight className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
              {cat.category}
              <span className="ml-auto text-xs text-text-muted">{cat.items.length} items</span>
            </button>

            {!collapsed.has(cat.category) && (
              <div className="divide-y divide-surface-border">
                {cat.items.map((item) => {
                  const progress = recordingProgress(item.recordingId, recordings);
                  return (
                    <Link
                      key={item.id}
                      href={`/student/videos/${item.recordingId}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10">
                        <PlayCircle className="h-5 w-5 text-brand-navy" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {item.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                          {item.moduleName && <span>{item.moduleName}</span>}
                          {progress && progress.watched_seconds > 0 && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(progress.watched_seconds / 60)}m
                              </span>
                            </>
                          )}
                        </div>
                        {progress?.completed && (
                          <span className="mt-0.5 inline-block text-[10px] font-medium text-status-success">
                            Completed
                          </span>
                        )}
                      </div>
                      <PlayCircle className="h-5 w-5 shrink-0 text-text-muted" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
