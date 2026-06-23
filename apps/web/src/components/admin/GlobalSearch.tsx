'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  BookOpen,
  Video,
  FileText,
  IndianRupee,
  Trophy,
  Calendar,
  Monitor,
  Megaphone,
  Mail,
  Settings,
  ShieldAlert,
  ArrowRight,
  Clock,
  X,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { fetchApi } from '@/lib/api-client';

interface QuickLink {
  label: string;
  href: string;
  icon: typeof Search;
  shortcut?: string;
}

const quickLinks: QuickLink[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN.HOME, icon: Monitor },
  { label: 'Students', href: ROUTES.ADMIN.STUDENTS, icon: Users },
  { label: 'Courses', href: ROUTES.ADMIN.COURSES, icon: BookOpen },
  { label: 'Tests', href: ROUTES.ADMIN.TESTS, icon: FileText },
  { label: 'Sessions', href: ROUTES.ADMIN.SESSIONS, icon: Calendar },
  { label: 'Recordings', href: ROUTES.ADMIN.RECORDINGS, icon: Video },
  { label: 'Payments', href: ROUTES.ADMIN.PAYMENTS, icon: IndianRupee },
  { label: 'Email Center', href: ROUTES.ADMIN.EMAIL_LOGS, icon: Mail },
  { label: 'Monitoring', href: ROUTES.ADMIN.MONITORING, icon: ShieldAlert },
  { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: Trophy },
];

const RECENT_SEARCH_KEY = 'admin-recent-searches';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const recent = loadRecent().filter((r) => r !== term);
  recent.unshift(term);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

interface SearchResult {
  id: string;
  type: string;
  label: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const recent = loadRecent();

  const filteredLinks = query
    ? quickLinks.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()))
    : quickLinks.slice(0, 5);

  const combinedItems = [
    ...results.map((r) => ({ ...r, kind: 'result' as const })),
    ...filteredLinks.map((l) => ({ ...l, kind: 'link' as const, id: l.href, type: 'Page', subtitle: l.href })),
  ].slice(0, 10);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const runSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const [students] = await Promise.all([
        fetchApi<any>(`/users?search=${encodeURIComponent(term)}&limit=3`).catch(() => ({ items: [] })),
      ]);
      const items = (students.items ?? []).slice(0, 3).map((s: any) => ({
        id: s.id,
        type: 'Student',
        label: s.name || s.email,
        subtitle: s.email || '',
        href: ROUTES.ADMIN.STUDENTS,
      }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      if (query) saveRecent(query);
      router.push(href);
    },
    [query, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, combinedItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        navigateTo(combinedItems[selectedIndex].href);
      }
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-muted px-3 py-1.5 text-xs text-text-muted hover:border-surface-border/80 hover:bg-surface-card hover:text-text-secondary transition-all duration-200 min-w-[180px]"
        aria-label="Open search (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="inline-flex h-5 items-center gap-0.5 rounded-md border border-surface-border bg-white px-1.5 text-2xs font-mono text-text-muted">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div ref={overlayRef} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-[15%] w-full max-w-xl -translate-x-1/2">
            <div className="mx-4 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-xl ring-1 ring-black/5">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
                {searching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-border border-t-brand-500" />
                ) : (
                  <Search className="h-4 w-4 text-text-muted" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search students, courses, pages..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="rounded-md p-0.5 text-text-muted hover:text-text-secondary">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-xs text-text-muted hover:text-text-secondary">
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2" role="listbox">
                {combinedItems.length === 0 && !query && recent.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Clock className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-xs font-medium text-text-muted">Recent searches</span>
                    </div>
                    {recent.map((term) => (
                      <button
                        key={term}
                        onClick={() => { setQuery(term); }}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted transition-colors"
                      >
                        <Clock className="h-4 w-4 text-text-muted" />
                        {term}
                      </button>
                    ))}
                  </div>
                )}

                {combinedItems.length === 0 && query && !searching && (
                  <div className="p-8 text-center">
                    <Search className="mx-auto h-6 w-6 text-text-muted" />
                    <p className="mt-2 text-sm text-text-muted">No results for &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {combinedItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      index === selectedIndex ? 'bg-brand-50' : 'hover:bg-surface-muted',
                    )}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      index === selectedIndex ? 'bg-brand-100' : 'bg-surface-muted',
                    )}>
                      {'icon' in item && item.icon ? (
                        <item.icon className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.label}</p>
                      {'type' in item && (
                        <p className="text-xs text-text-muted truncate">
                          {'kind' in item && item.kind === 'result' ? `${item.type} — ${item.subtitle}` : item.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-2xs text-text-muted shrink-0">{'kind' in item && item.kind === 'link' ? 'Jump to' : ''}</span>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-surface-border px-4 py-2">
                <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                  <kbd className="rounded-md border border-surface-border bg-surface-muted px-1.5 py-0.5 font-mono">&#8593;&#8595;</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                  <kbd className="rounded-md border border-surface-border bg-surface-muted px-1.5 py-0.5 font-mono">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                  <kbd className="rounded-md border border-surface-border bg-surface-muted px-1.5 py-0.5 font-mono">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
