'use client';

import { Fragment, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Activity,
  BarChart3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
  Zap,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getObservabilityDashboard,
  getErrors,
  getEvents,
  type DashboardOverview,
  type ErrorLogEntry,
  type EventLogEntry,
} from '@/lib/api/observability';

type Tab = 'errors' | 'events';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  error: 'text-orange-600 bg-orange-50 border-orange-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  debug: 'text-gray-600 bg-gray-50 border-gray-200',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  error: 'bg-orange-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  debug: 'bg-gray-500',
};

function SeverityBadge({ severity }: { severity: string }) {
  const key = severity?.toLowerCase() || 'info';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      SEVERITY_COLORS[key] || SEVERITY_COLORS.info,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[key] || SEVERITY_DOT.info)} />
      {severity}
    </span>
  );
}

function StatusBadge({ resolved }: { resolved: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
      resolved
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-red-50 text-red-700 border border-red-200',
    )}>
      {resolved ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {resolved ? 'Resolved' : 'Open'}
    </span>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value ?? '-'}</p>
        </div>
        <div className={cn('rounded-xl p-3', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminMonitoringPage() {
  const [activeTab, setActiveTab] = useState<Tab>('errors');

  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(false);

  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [errorsTotal, setErrorsTotal] = useState(0);
  const [errorsPage, setErrorsPage] = useState(1);
  const [errorsLimit] = useState(15);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLimit] = useState(15);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (activeTab === 'errors') loadErrors(errorsPage);
  }, [activeTab, errorsPage]);

  useEffect(() => {
    if (activeTab === 'events') loadEvents(eventsPage);
  }, [activeTab, eventsPage]);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    setDashboardError(false);
    try { const data = await getObservabilityDashboard(); setDashboard(data); }
    catch { setDashboardError(true); }
    finally { setLoadingDashboard(false); }
  };

  const loadErrors = async (page: number) => {
    setLoadingErrors(true);
    try { const r = await getErrors({ page, limit: errorsLimit }); setErrors(r.items); setErrorsTotal(r.total); }
    catch { setErrors([]); }
    finally { setLoadingErrors(false); }
  };

  const loadEvents = async (page: number) => {
    setLoadingEvents(true);
    try { const r = await getEvents({ page, limit: eventsLimit }); setEvents(r.items); setEventsTotal(r.total); }
    catch { setEvents([]); }
    finally { setLoadingEvents(false); }
  };

  const errorsTotalPages = Math.ceil(errorsTotal / errorsLimit);
  const eventsTotalPages = Math.ceil(eventsTotal / eventsLimit);

  const formatTime = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Monitoring Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">System observability, error tracking, and event logging</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-surface-border bg-surface-card p-1 w-fit">
        <button onClick={() => setActiveTab('errors')} className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', activeTab === 'errors' ? 'bg-brand-navy text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted')}>
          <AlertTriangle className="h-4 w-4" />Error Log
        </button>
        <button onClick={() => setActiveTab('events')} className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', activeTab === 'events' ? 'bg-brand-navy text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted')}>
          <Activity className="h-4 w-4" />Event Log
        </button>
      </div>

      {activeTab === 'errors' && (
        <div className="space-y-6">
          {loadingDashboard ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" /></div>
          ) : dashboardError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm font-medium text-red-700">Failed to load dashboard data.</p>
              <button onClick={loadDashboard} className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800">Retry</button>
            </div>
          ) : dashboard ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryCard title="Errors (24h)" value={dashboard.errorCountsLast24h} icon={AlertTriangle} color="bg-red-600" />
                <SummaryCard title="Events (24h)" value={dashboard.eventCountsLast24h} icon={Activity} color="bg-blue-600" />
                <SummaryCard title="Total Metrics" value={dashboard.totalMetrics} icon={BarChart3} color="bg-purple-600" />
              </div>

              {dashboard.errorCountsByType.length > 0 && (
                <div className="rounded-xl border border-surface-border bg-surface-card p-6">
                  <h2 className="mb-4 text-lg font-semibold text-text-primary">Errors by Type</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {dashboard.errorCountsByType.map((item) => (
                      <div key={item.errorType} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-muted/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-red-100 p-2"><Zap className="h-4 w-4 text-red-600" /></div>
                          <div><p className="text-sm font-medium text-text-primary">{item.errorType}</p><p className="text-xs text-text-muted">errors</p></div>
                        </div>
                        <span className="text-xl font-bold text-text-primary">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboard.slowestEndpoints.length > 0 && (
                <div className="rounded-xl border border-surface-border bg-surface-card p-6">
                  <h2 className="mb-4 text-lg font-semibold text-text-primary">Slowest Endpoints (avg latency)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-border bg-surface-muted">
                          <th className="px-4 py-3 text-left font-medium text-text-secondary">Endpoint</th>
                          <th className="px-4 py-3 text-left font-medium text-text-secondary">Avg Latency</th>
                          <th className="px-4 py-3 text-left font-medium text-text-secondary">Requests</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {dashboard.slowestEndpoints.map((ep) => (
                          <tr key={ep.endpoint}>
                            <td className="px-4 py-3 text-sm text-text-primary font-mono">{ep.endpoint}</td>
                            <td className="px-4 py-3 text-sm"><span className={cn('font-semibold', ep.avgLatency > 1000 ? 'text-red-600' : ep.avgLatency > 500 ? 'text-yellow-600' : 'text-green-600')}>{ep.avgLatency}ms</span></td>
                            <td className="px-4 py-3 text-sm text-text-secondary">{ep.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-surface-border bg-surface-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Error Log</h2>
                  {loadingErrors && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border bg-surface-muted">
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Time</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Severity</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Message</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">URL</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {errors.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">No errors recorded.</td></tr>
                      ) : errors.map((err) => (
                        <Fragment key={err.id}>
                          <tr onClick={() => setExpandedRow(expandedRow === err.id ? null : err.id)} className="cursor-pointer hover:bg-surface-muted/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatTime(err.created_at)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                                <Server className="h-3 w-3" />{err.error_type}
                              </span>
                            </td>
                            <td className="px-4 py-3"><SeverityBadge severity={err.severity} /></td>
                            <td className="px-4 py-3 max-w-xs truncate text-text-primary">{err.message || '-'}</td>
                            <td className="px-4 py-3 max-w-[160px] truncate text-text-secondary font-mono text-xs">{err.url || '-'}</td>
                            <td className="px-4 py-3"><StatusBadge resolved={err.resolved} /></td>
                          </tr>
                          {expandedRow === err.id && (
                            <tr className="bg-surface-muted/30">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="rounded-lg border border-surface-border bg-surface-card p-4 space-y-2">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-xs font-medium text-text-muted">Error ID</span><p className="text-text-primary font-mono text-xs mt-0.5">{err.id}</p></div>
                                    <div><span className="text-xs font-medium text-text-muted">Method</span><p className="text-text-primary text-xs mt-0.5">{err.method || '—'}</p></div>
                                    <div><span className="text-xs font-medium text-text-muted">Status Code</span><p className="text-text-primary text-xs mt-0.5">{err.status_code ?? '—'}</p></div>
                                    <div><span className="text-xs font-medium text-text-muted">Created At</span><p className="text-text-primary text-xs mt-0.5">{new Date(err.created_at).toLocaleString('en-IN')}</p></div>
                                    {err.stack_trace && (
                                      <div className="col-span-2">
                                        <span className="text-xs font-medium text-text-muted">Stack Trace</span>
                                        <pre className="mt-0.5 text-xs text-text-secondary font-mono whitespace-pre-wrap bg-surface-muted rounded-lg p-3 max-h-48 overflow-y-auto">{err.stack_trace}</pre>
                                      </div>
                                    )}
                                    {err.context && Object.keys(err.context).length > 0 && (
                                      <div className="col-span-2">
                                        <span className="text-xs font-medium text-text-muted">Context</span>
                                        <pre className="mt-0.5 text-xs text-text-secondary font-mono whitespace-pre-wrap bg-surface-muted rounded-lg p-3 max-h-32 overflow-y-auto">{JSON.stringify(err.context, null, 2)}</pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                {errorsTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-surface-border pt-4 mt-4">
                    <p className="text-xs text-text-muted">Showing {(errorsPage - 1) * errorsLimit + 1}–{Math.min(errorsPage * errorsLimit, errorsTotal)} of {errorsTotal}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setErrorsPage((p) => Math.max(1, p - 1))} disabled={errorsPage <= 1} className={cn('flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', errorsPage <= 1 ? 'border-surface-border text-text-muted cursor-not-allowed' : 'border-surface-border text-text-secondary hover:bg-surface-muted hover:text-text-primary')}>
                        <ChevronLeft className="h-3.5 w-3.5" />Previous
                      </button>
                      <button onClick={() => setErrorsPage((p) => Math.min(errorsTotalPages, p + 1))} disabled={errorsPage >= errorsTotalPages} className={cn('flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', errorsPage >= errorsTotalPages ? 'border-surface-border text-text-muted cursor-not-allowed' : 'border-surface-border text-text-secondary hover:bg-surface-muted hover:text-text-primary')}>
                        Next<ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Event Log</h2>
            {loadingEvents && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Event Type</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Severity</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loadingEvents ? (
                  <tr><td colSpan={5} className="px-4 py-12"><div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" /></div></td></tr>
                ) : events.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-text-muted">No events recorded.</td></tr>
                ) : events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatTime(ev.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                        <Info className="h-3 w-3" />{ev.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{ev.source || <span className="text-text-muted">—</span>}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={ev.severity} /></td>
                    <td className="px-4 py-3 text-xs text-text-secondary max-w-xs truncate">{ev.message || <span className="text-text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {eventsTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-border pt-4 mt-4">
              <p className="text-xs text-text-muted">Showing {(eventsPage - 1) * eventsLimit + 1}–{Math.min(eventsPage * eventsLimit, eventsTotal)} of {eventsTotal}</p>
              <div className="flex gap-2">
                <button onClick={() => setEventsPage((p) => Math.max(1, p - 1))} disabled={eventsPage <= 1} className={cn('flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', eventsPage <= 1 ? 'border-surface-border text-text-muted cursor-not-allowed' : 'border-surface-border text-text-secondary hover:bg-surface-muted hover:text-text-primary')}>
                  <ChevronLeft className="h-3.5 w-3.5" />Previous
                </button>
                <button onClick={() => setEventsPage((p) => Math.min(eventsTotalPages, p + 1))} disabled={eventsPage >= eventsTotalPages} className={cn('flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', eventsPage >= eventsTotalPages ? 'border-surface-border text-text-muted cursor-not-allowed' : 'border-surface-border text-text-secondary hover:bg-surface-muted hover:text-text-primary')}>
                  Next<ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
