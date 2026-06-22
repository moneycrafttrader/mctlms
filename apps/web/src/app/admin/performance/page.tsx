'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, Gauge, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { getMetrics } from '@/lib/api/observability';
import { cn } from '@/lib/utils';

interface EndpointRow {
  endpoint: string;
  method: string;
  requestCount: number;
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
}

const TIME_PRESETS = [
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'All Time', value: 'all' },
] as const;

function getDateRange(preset: string): { startDate?: string; endDate?: string } {
  if (preset === 'all') return {};
  const now = new Date();
  const start = new Date(now);
  if (preset === '1h') start.setHours(start.getHours() - 1);
  else if (preset === '24h') start.setDate(start.getDate() - 1);
  else if (preset === '7d') start.setDate(start.getDate() - 7);
  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary font-mono">{value ?? '-'}</p>
        </div>
        <div className={cn('rounded-xl p-3', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPerformancePage() {
  const [timePreset, setTimePreset] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [latencyData, setLatencyData] = useState<{ avg: number; p50: number; p95: number; p99: number; min: number; max: number; count: number } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timePreset]);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const range = getDateRange(timePreset);
      const result = await getMetrics({ metricName: 'endpoint_latency', ...range });
      setLatencyData(result.count > 0 ? result : null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Performance Analytics</h1>
        <p className="mt-1 text-sm text-text-muted">Backend endpoint latency and throughput metrics</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-surface-border bg-surface-card p-1 w-fit">
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => setTimePreset(preset.value)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              timePreset === preset.value
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm font-medium text-red-700">Failed to load performance data.</p>
          <button onClick={fetchData} className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800">Retry</button>
        </div>
      ) : !latencyData ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-12">
          <div className="text-center">
            <Gauge className="mx-auto h-12 w-12 text-text-muted mb-3" />
            <p className="text-sm font-medium text-text-primary">No performance data yet</p>
            <p className="mt-1 text-xs text-text-muted">API requests will be automatically tracked once traffic flows through the system.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Requests" value={latencyData.count} icon={Activity} color="bg-blue-600" />
            <StatCard title="Avg Latency" value={`${latencyData.avg}ms`} icon={Clock} color="bg-emerald-600" />
            <StatCard title="P95 Latency" value={`${latencyData.p95}ms`} icon={Gauge} color="bg-orange-600" />
            <StatCard title="P99 Latency" value={`${latencyData.p99}ms`} icon={Zap} color="bg-red-600" />
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Latency Distribution</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-surface-border bg-surface-muted/50 p-4 text-center">
                <p className="text-xs font-medium text-text-muted mb-1">Min</p>
                <p className="text-xl font-bold text-text-primary font-mono">{latencyData.min}ms</p>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-muted/50 p-4 text-center">
                <p className="text-xs font-medium text-text-muted mb-1">P50 (Median)</p>
                <p className="text-xl font-bold text-text-primary font-mono">{latencyData.p50}ms</p>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-muted/50 p-4 text-center">
                <p className="text-xs font-medium text-text-muted mb-1">P95</p>
                <p className={cn('text-xl font-bold font-mono', latencyData.p95 > 1000 ? 'text-red-600' : latencyData.p95 > 500 ? 'text-yellow-600' : 'text-green-600')}>{latencyData.p95}ms</p>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-muted/50 p-4 text-center">
                <p className="text-xs font-medium text-text-muted mb-1">P99</p>
                <p className={cn('text-xl font-bold font-mono', latencyData.p99 > 2000 ? 'text-red-600' : latencyData.p99 > 1000 ? 'text-yellow-600' : 'text-green-600')}>{latencyData.p99}ms</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Performance Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Avg Latency Health</span>
                  <span className={cn('font-semibold', latencyData.avg < 200 ? 'text-green-600' : latencyData.avg < 500 ? 'text-yellow-600' : 'text-red-600')}>
                    {latencyData.avg < 200 ? 'Excellent' : latencyData.avg < 500 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', latencyData.avg < 200 ? 'bg-green-500' : latencyData.avg < 500 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${Math.min(100, (latencyData.avg / 1000) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">P95 Latency Health</span>
                  <span className={cn('font-semibold', latencyData.p95 < 500 ? 'text-green-600' : latencyData.p95 < 1000 ? 'text-yellow-600' : 'text-red-600')}>
                    {latencyData.p95 < 500 ? 'Excellent' : latencyData.p95 < 1000 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', latencyData.p95 < 500 ? 'bg-green-500' : latencyData.p95 < 1000 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${Math.min(100, (latencyData.p95 / 2000) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
