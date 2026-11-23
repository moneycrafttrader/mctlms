'use client';

import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, FileText, HelpCircle, Video } from 'lucide-react';
import { getStudentBatchCurriculum, type StudentCurriculumCategory } from '@/lib/api/videos';
import { getBatchAdminProgress } from '@/lib/api/recordings';

const typeIcon = (type: string) => {
  switch (type) {
    case 'test':
      return HelpCircle;
    case 'session':
      return Calendar;
    case 'pdf':
      return FileText;
    default:
      return Video;
  }
};

export function TeacherCurriculumPanel({ batchId }: { batchId: string }) {
  const [categories, setCategories] = useState<StudentCurriculumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [avgProgress, setAvgProgress] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [curriculum, progress] = await Promise.all([
          getStudentBatchCurriculum(batchId),
          getBatchAdminProgress(batchId).catch(() => null),
        ]);
        if (cancelled) return;
        setCategories(curriculum ?? []);
        if (progress?.averageProgress != null) {
          setAvgProgress(Math.round(progress.averageProgress));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load curriculum');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const toggle = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-status-error" role="alert">{error}</p>;
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
        <p className="text-sm font-medium text-text-primary">No published curriculum</p>
        <p className="mt-1 text-sm text-text-muted">Published items will appear here for your batch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {avgProgress != null && (
        <p className="text-sm text-text-muted">
          Class average progress: <span className="font-semibold text-text-primary">{avgProgress}%</span>
        </p>
      )}
      {categories.map((cat) => {
        const open = !collapsed.has(cat.category);
        const Icon = ChevronRight;
        return (
          <section key={cat.category} className="rounded-xl border border-surface-border bg-surface-card">
            <button
              type="button"
              onClick={() => toggle(cat.category)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              aria-expanded={open}
            >
              <span className="text-sm font-semibold text-text-primary">{cat.category}</span>
              <span className="flex items-center gap-2 text-xs text-text-muted">
                {cat.items.length} items
                {open ? <ChevronDown className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
            </button>
            {open && (
              <ul className="divide-y divide-surface-border border-t border-surface-border">
                {cat.items.map((item) => {
                  const ItemIcon = typeIcon(item.content_type ?? 'recording');
                  const title =
                    (item as { title_override?: string }).title_override ||
                    item.content?.title ||
                    item.module_name ||
                    item.content_type ||
                    'Item';
                  return (
                    <li key={`${item.id}-${item.sort_order}`} className="flex items-start gap-3 px-4 py-3">
                      <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{title}</p>
                        <p className="text-xs uppercase text-text-muted">{item.content_type}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}