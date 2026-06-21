'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Users,
  Filter,
  RefreshCw,
  Search,
  Eye,
  Activity,
} from 'lucide-react';
import { getScreenRecordingViolations, getViolationCounters, getAllRiskScores } from '@/lib/api/screen-recording';
import type { ContextType } from '@/lib/api/screen-recording';

type Tab = 'violations' | 'risk-scores' | 'counters';

const DETECTION_LABELS: Record<string, string> = {
  visibilitychange_hidden: 'Tab Hidden',
  window_blur: 'Window Blur',
  window_focus_lost: 'Focus Lost',
  printscreen_key: 'PrintScreen',
  devtools_open: 'DevTools',
  get_display_media: 'Screen Share',
  multiple_displays: 'Multi Display',
};

const DETECTION_COLORS: Record<string, string> = {
  visibilitychange_hidden: 'bg-yellow-100 text-yellow-800',
  window_blur: 'bg-blue-100 text-blue-800',
  window_focus_lost: 'bg-blue-100 text-blue-800',
  printscreen_key: 'bg-red-100 text-red-800',
  devtools_open: 'bg-purple-100 text-purple-800',
  get_display_media: 'bg-orange-100 text-orange-800',
  multiple_displays: 'bg-gray-100 text-gray-800',
};

const RISK_BADGE = (score: number) => {
  if (score >= 70) return 'bg-red-100 text-red-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export function ViolationsAdminClient() {
  const [tab, setTab] = useState<Tab>('violations');
  const [violations, setViolations] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [riskScores, setRiskScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextFilter, setContextFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [v, c, r] = await Promise.all([
        getScreenRecordingViolations(contextFilter ? { contextType: contextFilter } : undefined),
        getViolationCounters(),
        getAllRiskScores(),
      ]);
      setViolations(v);
      setCounters(c);
      setRiskScores(r);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [contextFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* ── Tab bar ── */}
      <div className="flex gap-2 border-b border-gray-200">
        {([
          { key: 'violations' as Tab, label: 'Violations', icon: AlertTriangle },
          { key: 'risk-scores' as Tab, label: 'Risk Scores', icon: ShieldAlert },
          { key: 'counters' as Tab, label: 'User Counters', icon: Users },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {tab === 'violations' && (
            <select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              <option value="">All Contexts</option>
              <option value="recording">Recordings</option>
              <option value="live_session">Live Sessions</option>
              <option value="test">Tests</option>
            </select>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {tab === 'violations' && <ViolationsTable violations={violations} loading={loading} />}
      {tab === 'risk-scores' && <RiskScoresTable riskScores={riskScores} loading={loading} />}
      {tab === 'counters' && <CountersTable counters={counters} loading={loading} />}
    </div>
  );
}

/* ─── Violations Table ─── */
function ViolationsTable({ violations, loading }: { violations: any[]; loading: boolean }) {
  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Loading violations...</div>;
  if (violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <ShieldAlert className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-medium">No violations recorded</p>
        <p className="mt-1 text-sm">Screen recording detection is active but no events have been triggered.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Detection</th>
            <th className="px-4 py-3">Context</th>
            <th className="px-4 py-3">Details</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {violations.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{v.profiles?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{v.profiles?.email}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DETECTION_COLORS[v.detection_type] || 'bg-gray-100 text-gray-800'}`}>
                  {DETECTION_LABELS[v.detection_type] || v.detection_type}
                </span>
              </td>
              <td className="px-4 py-3 text-xs capitalize text-gray-600">{v.context_type?.replace('_', ' ')}</td>
              <td className="max-w-[200px] truncate px-4 py-3 text-xs text-gray-500">
                {v.details ? JSON.stringify(v.details).slice(0, 80) : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                {new Date(v.created_at).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Risk Scores Table ─── */
function RiskScoresTable({ riskScores, loading }: { riskScores: any[]; loading: boolean }) {
  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Loading risk scores...</div>;
  if (riskScores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <Activity className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-medium">No risk scores yet</p>
        <p className="mt-1 text-sm">Risk scores are generated after violations are recorded.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Overall</th>
            <th className="px-4 py-3">Recording</th>
            <th className="px-4 py-3">Live Session</th>
            <th className="px-4 py-3">Test</th>
            <th className="px-4 py-3">24h</th>
            <th className="px-4 py-3">7d</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {riskScores.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{r.profiles?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{r.profiles?.email}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${RISK_BADGE(r.overall_score)}`}>
                  {r.overall_score}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.recording_score}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.live_session_score}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.test_score}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.violations_24h}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.violations_7d}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.total_violations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Counters Table ─── */
function CountersTable({ counters, loading }: { counters: any[]; loading: boolean }) {
  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Loading counters...</div>;
  if (counters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <Users className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-medium">No counters recorded</p>
        <p className="mt-1 text-sm">Counters are generated when violations are detected.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Context</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Visibility</th>
            <th className="px-4 py-3">Blur</th>
            <th className="px-4 py-3">Focus Loss</th>
            <th className="px-4 py-3">PrintScreen</th>
            <th className="px-4 py-3">DevTools</th>
            <th className="px-4 py-3">Screen Share</th>
            <th className="px-4 py-3">Last</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {counters.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{c.profiles?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{c.profiles?.email}</div>
              </td>
              <td className="px-4 py-3 text-xs capitalize text-gray-600">{c.context_type?.replace('_', ' ')}</td>
              <td className="px-4 py-3 text-xs font-semibold text-gray-900">{c.total_violations}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.visibilitychange_count || 0}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.blur_count || 0}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.focus_loss_count || 0}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.printscreen_count || 0}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.devtools_count || 0}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.display_media_count || 0}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                {c.last_violation_at ? new Date(c.last_violation_at).toLocaleString('en-IN') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
