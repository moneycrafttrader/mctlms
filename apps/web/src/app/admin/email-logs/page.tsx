'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Send,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEmailLogs,
  getEmailStats,
  getEmailAnalytics,
  retryEmail,
  type EmailLogEntry,
  type EmailLogListResponse,
  type EmailLogStats,
  type EmailLogAnalytics,
} from '@/lib/api/email-logs';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'retrying', label: 'Retrying' },
] as const;

const TEMPLATE_OPTIONS = [
  { value: '', label: 'All Templates' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'notification', label: 'Notification' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'login_alert', label: 'Login Alert' },
  { value: 'test_result', label: 'Test Result' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  retrying: 'bg-blue-50 text-blue-700 border-blue-200',
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  sent: CheckCircle2,
  failed: XCircle,
  pending: Clock,
  retrying: RotateCw,
};

function StatCard({ title, value, icon: Icon, color, href }: {
  title: string;
  value: number;
  icon: any;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value.toLocaleString('en-IN')}</p>
        </div>
        <div className={cn('rounded-lg p-2.5', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function AnalyticsMini({ analytics }: { analytics: EmailLogAnalytics | null }) {
  if (!analytics) return null;
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-brand-navy" />
        <h2 className="text-base font-semibold text-text-primary">Email Analytics</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-text-muted">Delivery Rate</p>
          <p className="text-lg font-bold text-emerald-600">{analytics.deliveryRate}%</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Failure Rate</p>
          <p className="text-lg font-bold text-red-600">{analytics.failureRate}%</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Total Emails</p>
          <p className="text-lg font-bold text-text-primary">{analytics.total.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Sent (7d)</p>
          <p className="text-lg font-bold text-text-primary">
            {analytics.emailsPerDay.reduce((sum, d) => sum + d.count, 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      {analytics.mostUsedTemplates.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Most Used Templates</p>
          <div className="flex flex-wrap gap-2">
            {analytics.mostUsedTemplates.slice(0, 6).map((t) => (
              <span key={t.name} className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
                {t.name}
                <span className="text-text-muted">({t.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailLogsPage() {
  const [data, setData] = useState<EmailLogListResponse | null>(null);
  const [stats, setStats] = useState<EmailLogStats | null>(null);
  const [analytics, setAnalytics] = useState<EmailLogAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [status, setStatus] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [retryMessage, setRetryMessage] = useState<{ id: string; text: string; success: boolean } | null>(null);

  const fetchData = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, unknown> = { page: pageNum, limit };
      if (status) params.status = status;
      if (templateName) params.templateName = templateName;
      if (recipientSearch.trim()) params.recipientSearch = recipientSearch.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await getEmailLogs(params);
      setData(result);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [status, templateName, recipientSearch, startDate, endDate, limit]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    loadStats();
    loadAnalytics();
  }, []);

  const loadStats = async () => {
    try { setStats(await getEmailStats()); } catch { /* ignore */ }
  };

  const loadAnalytics = async () => {
    try { setAnalytics(await getEmailAnalytics()); } catch { /* ignore */ }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchData(1);
  };

  const handleClear = () => {
    setStatus('');
    setTemplateName('');
    setRecipientSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    fetchData(1);
  };

  const handleRetry = async (id: string) => {
    setRetryingIds((prev) => new Set(prev).add(id));
    try {
      await retryEmail(id);
      setRetryMessage({ id, text: 'Email retry initiated successfully', success: true });
      fetchData(page);
      loadStats();
    } catch (err: any) {
      setRetryMessage({ id, text: err.message || 'Retry failed', success: false });
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    setTimeout(() => setRetryMessage(null), 4000);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Email Delivery Center</h1>
        <p className="mt-1 text-sm text-text-muted">Single source of truth for all email activity. Monitor, audit, and retry email deliveries.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total Sent" value={stats.sent} icon={Send} color="bg-brand-navy" />
          <StatCard title="Failed" value={stats.failed} icon={XCircle} color="bg-red-600" />
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
          <StatCard title="Retrying" value={stats.retrying} icon={RotateCw} color="bg-blue-600" />
          <StatCard title="Total" value={stats.total} icon={Activity} color="bg-purple-600" />
        </div>
      )}

      <AnalyticsMini analytics={analytics} />

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        >
          {TEMPLATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            placeholder="Search recipient..."
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
          onClick={handleClear}
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
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Sent Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                    Failed to load email logs.{' '}
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
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                    No email logs found.
                  </td>
                </tr>
              ) : (
                data.items.map((entry) => {
                  const StatusIcon = STATUS_ICONS[entry.status] || Mail;
                  return (
                    <tr key={entry.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary font-medium max-w-[200px] truncate">
                        {entry.recipient_email}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary max-w-[240px] truncate">
                        {entry.subject}
                      </td>
                      <td className="px-4 py-3">
                        {entry.template_name ? (
                          <span className="inline-flex items-center rounded-full border border-surface-border bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary">
                            {entry.template_name}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-700 border-gray-200',
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {formatTime(entry.sent_at || entry.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
                            title="View details"
                          >
                            {expandedRow === entry.id ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {entry.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(entry.id)}
                              disabled={retryingIds.has(entry.id) || entry.retry_count >= entry.max_retries}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium transition-colors',
                                retryingIds.has(entry.id) || entry.retry_count >= entry.max_retries
                                  ? 'text-text-muted cursor-not-allowed'
                                  : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700',
                              )}
                              title={entry.retry_count >= entry.max_retries ? 'Max retries reached' : 'Retry email'}
                            >
                              {retryingIds.has(entry.id) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {retryMessage && (
        <div className={cn(
          'rounded-xl border p-4 text-sm',
          retryMessage.success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700',
        )}>
          {retryMessage.text}
        </div>
      )}

      {expandedRow && data && (() => {
        const entry = data.items.find((e) => e.id === expandedRow);
        if (!entry) return null;
        return (
          <div className="rounded-xl border border-surface-border bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Email Delivery Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-text-muted">Email ID</span>
                <p className="text-text-primary font-mono text-xs mt-0.5">{entry.id}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Provider</span>
                <p className="text-text-primary mt-0.5 capitalize">{entry.provider}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Provider Message ID</span>
                <p className="text-text-primary font-mono text-xs mt-0.5">{entry.provider_message_id || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Created</span>
                <p className="text-text-primary text-xs mt-0.5">{formatTime(entry.created_at)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Sent At</span>
                <p className="text-text-primary text-xs mt-0.5">{formatTime(entry.sent_at) || 'Not sent'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-muted">Retries</span>
                <p className="text-text-primary mt-0.5">{entry.retry_count} / {entry.max_retries}</p>
              </div>
              {entry.last_retry_at && (
                <div>
                  <span className="text-xs font-medium text-text-muted">Last Retry</span>
                  <p className="text-text-primary text-xs mt-0.5">{formatTime(entry.last_retry_at)}</p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-text-muted">Template Type</span>
                <p className="text-text-primary mt-0.5">{entry.template_type || '—'}</p>
              </div>
            </div>
            {entry.error_message && (
              <div>
                <span className="text-xs font-medium text-red-600">Error Message</span>
                <pre className="mt-1 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {entry.error_message}
                </pre>
              </div>
            )}
            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <div>
                <span className="text-xs font-medium text-text-muted">Metadata</span>
                <pre className="mt-1 rounded-lg bg-surface-muted p-3 text-xs text-text-secondary font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {JSON.stringify(entry.metadata, null, 2)}
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
