'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuditLogs, type AuditLogEntry } from '@/lib/api/audit';

const ENTITY_TYPES = ['all', 'course', 'batch', 'recording', 'payment', 'test', 'certificate', 'announcement'] as const;

const ACTIONS = ['all', 'created', 'updated', 'deleted', 'published', 'assigned', 'generated', 'issued'] as const;

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-800 border-green-200',
  updated: 'bg-blue-100 text-blue-800 border-blue-200',
  deleted: 'bg-red-100 text-red-800 border-red-200',
  published: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  assigned: 'bg-purple-100 text-purple-800 border-purple-200',
  generated: 'bg-orange-100 text-orange-800 border-orange-200',
  issued: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [entityType, setEntityType] = useState('all');
  const [action, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, unknown> = { page: pageNum, limit };
      if (entityType !== 'all') params.entityType = entityType;
      if (action !== 'all') params.action = action;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await getAuditLogs(params);
      setData(result);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [entityType, action, search, startDate, endDate, limit]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchData(1);
  };

  const handleClear = () => {
    setEntityType('all');
    setAction('all');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleClearThenFetch = () => {
    handleClear();
    fetchData(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  const shortId = (id: string) => id.slice(0, 8);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Audit Log</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        >
          <option value="all">All Entities</option>
          {ENTITY_TYPES.filter((t) => t !== 'all').map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        >
          <option value="all">All Actions</option>
          {ACTIONS.filter((a) => a !== 'all').map((a) => (
            <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-xl border border-surface-border bg-white pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none w-56"
          />
        </div>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />

        <button
          onClick={handleApplyFilters}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm transition-all duration-200"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>

        <button
          onClick={handleClearThenFetch}
          className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all duration-200"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="overflow-hidden rounded-xl border border-surface-border bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-text-muted">
                    Failed to load audit logs.{' '}
                    <button
                      onClick={() => fetchData(page)}
                      className="font-medium text-brand-600 underline hover:text-brand-700"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-text-muted">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                data.items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {formatTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-700 border-gray-200',
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      <span className="font-medium">{entry.entityType}</span>
                      <span className="text-text-muted">: </span>
                      <span className="font-mono text-xs text-text-secondary">{shortId(entry.entityId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                      >
                        {expandedRow === entry.id ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            Expand
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {expandedRow && data && (() => {
        const entry = data.items.find((e) => e.id === expandedRow);
        if (!entry) return null;
        const details: Record<string, unknown> = {};
        if (entry.changes) details.changes = entry.changes;
        if (entry.metadata) details.metadata = entry.metadata;
        return (
          <div className="rounded-xl border border-surface-border bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Audit Log Entry Details
              </h3>
              <button
                onClick={() => copyToClipboard(JSON.stringify(details, null, 2))}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-text-muted">Action</span>
                <p className="text-text-primary mt-0.5 capitalize">{entry.action}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Entity</span>
                <p className="text-text-primary mt-0.5">{entry.entityType}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Entity ID</span>
                <p className="text-text-primary font-mono text-xs mt-0.5">{entry.entityId}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Actor ID</span>
                <p className="text-text-primary font-mono text-xs mt-0.5">{entry.actorId || '—'}</p>
              </div>
              {entry.actorName && (
                <div>
                  <span className="text-xs font-medium text-text-muted">Actor Name</span>
                  <p className="text-text-primary mt-0.5">{entry.actorName}</p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-text-muted">IP Address</span>
                <p className="text-text-primary font-mono text-xs mt-0.5">{entry.ipAddress || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Timestamp</span>
                <p className="text-text-primary text-xs mt-0.5">{formatTime(entry.createdAt)}</p>
              </div>
              {entry.userAgent && (
                <div className="col-span-2">
                  <span className="text-xs font-medium text-text-muted">User Agent</span>
                  <p className="text-text-primary text-xs mt-0.5 break-all">{entry.userAgent}</p>
                </div>
              )}
            </div>
            {Object.keys(details).length > 0 && (
              <div>
                <span className="text-xs font-medium text-text-muted">Changes / Metadata</span>
                <pre className="mt-1 rounded-lg bg-surface-muted p-4 text-xs text-text-secondary font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      })()}

      {data && data.items.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-surface-border bg-white px-5 py-3">
          <p className="text-xs text-text-muted">
            Page {data.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                page <= 1
                  ? 'border-surface-border text-text-muted cursor-not-allowed'
                  : 'border-surface-border text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                page >= totalPages
                  ? 'border-surface-border text-text-muted cursor-not-allowed'
                  : 'border-surface-border text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
