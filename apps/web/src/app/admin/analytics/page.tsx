'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  FileText,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle2,
  XCircle,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { getOverallAnalytics, getTestAnalytics, getTests } from '@/lib/api/assessments';
import { cn } from '@/lib/utils';
import type { TestResponse } from '@/lib/api/assessments';

interface OverallStats {
  totalTests?: number;
  totalAttempts?: number;
  overallAverage?: number;
  totalStudents?: number;
}

interface QuestionPerf {
  questionId?: string;
  questionText?: string;
  correctPercentage?: number;
  incorrectPercentage?: number;
}

interface BatchPerf {
  batchName?: string;
  averageScore?: number;
  attempts?: number;
}

interface TopicPerf {
  topicName?: string;
  accuracy?: number;
}

interface TestAnalyticsData {
  stats?: {
    attempts?: number;
    averageScore?: number;
    highestScore?: number;
    lowestScore?: number;
    passRate?: number;
    averageAccuracy?: number;
  };
  questionPerformance?: QuestionPerf[];
  batchPerformance?: BatchPerf[];
  topicPerformance?: TopicPerf[];
}

function StatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value ?? '-'}</p>
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
        </div>
        <div className={cn('rounded-xl p-3', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [overall, setOverall] = useState<OverallStats>({});
  const [tests, setTests] = useState<TestResponse[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [testAnalytics, setTestAnalytics] = useState<TestAnalyticsData | null>(null);
  const [loadingOverall, setLoadingOverall] = useState(true);
  const [loadingTestAnalytics, setLoadingTestAnalytics] = useState(false);

  useEffect(() => {
    loadOverall();
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedTestId) loadTestAnalytics(selectedTestId);
  }, [selectedTestId]);

  const loadOverall = async () => {
    setLoadingOverall(true);
    try {
      const data = await getOverallAnalytics();
      setOverall(data);
    } catch {
      setOverall({});
    } finally {
      setLoadingOverall(false);
    }
  };

  const loadTests = async () => {
    try {
      const result = await getTests({ limit: 100 });
      setTests(result.items);
    } catch {}
  };

  const loadTestAnalytics = async (testId: string) => {
    setLoadingTestAnalytics(true);
    try {
      const data = await getTestAnalytics(testId);
      setTestAnalytics(data);
    } catch {
      setTestAnalytics(null);
    } finally {
      setLoadingTestAnalytics(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Track test performance and student progress</p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Overall Analytics</h2>
        {loadingOverall ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Tests"
              value={overall.totalTests ?? 0}
              icon={FileText}
              color="bg-blue-600"
            />
            <StatCard
              title="Total Attempts"
              value={overall.totalAttempts ?? 0}
              icon={Users}
              color="bg-purple-600"
            />
            <StatCard
              title="Overall Average"
              value={overall.overallAverage != null ? `${overall.overallAverage}%` : '-'}
              icon={Award}
              color="bg-emerald-600"
              subtitle={overall.overallAverage != null ? (overall.overallAverage >= 50 ? 'Above average' : 'Below average') : undefined}
            />
            <StatCard
              title="Total Students"
              value={overall.totalStudents ?? 0}
              icon={Target}
              color="bg-orange-600"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Per-Test Analytics</h2>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="rounded-xl border border-surface-border bg-surface-page py-2 px-4 text-sm text-text-primary focus:border-brand-navy focus:outline-none"
          >
            <option value="">Select a test</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {!selectedTestId ? (
          <p className="py-8 text-center text-sm text-text-muted">Select a test to view its analytics.</p>
        ) : loadingTestAnalytics ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
          </div>
        ) : !testAnalytics ? (
          <p className="py-8 text-center text-sm text-text-muted">No analytics available for this test yet.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Attempts"
                value={testAnalytics.stats?.attempts ?? 0}
                icon={Users}
                color="bg-blue-600"
              />
              <StatCard
                title="Average Score"
                value={testAnalytics.stats?.averageScore != null ? `${testAnalytics.stats.averageScore}%` : '-'}
                icon={Award}
                color="bg-emerald-600"
              />
              <StatCard
                title="Highest Score"
                value={testAnalytics.stats?.highestScore != null ? `${testAnalytics.stats.highestScore}%` : '-'}
                icon={TrendingUp}
                color="bg-green-600"
              />
              <StatCard
                title="Lowest Score"
                value={testAnalytics.stats?.lowestScore != null ? `${testAnalytics.stats.lowestScore}%` : '-'}
                icon={TrendingDown}
                color="bg-red-600"
              />
              <StatCard
                title="Pass Rate"
                value={testAnalytics.stats?.passRate != null ? `${testAnalytics.stats.passRate}%` : '-'}
                icon={CheckCircle2}
                color="bg-teal-600"
              />
              <StatCard
                title="Average Accuracy"
                value={testAnalytics.stats?.averageAccuracy != null ? `${testAnalytics.stats.averageAccuracy}%` : '-'}
                icon={Target}
                color="bg-indigo-600"
              />
            </div>

            {testAnalytics.questionPerformance && testAnalytics.questionPerformance.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-text-primary mb-3">Question Performance</h3>
                <div className="overflow-x-auto rounded-xl border border-surface-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-muted border-b border-surface-border">
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Question</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Correct %</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Incorrect %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {testAnalytics.questionPerformance.map((q, i) => (
                        <tr key={q.questionId || i} className="hover:bg-surface-muted/50">
                          <td className="px-4 py-3 text-text-primary max-w-md truncate">
                            {q.questionText || `Question ${i + 1}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 rounded-full bg-surface-muted overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    (q.correctPercentage ?? 0) >= 70 ? 'bg-green-500' :
                                    (q.correctPercentage ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500',
                                  )}
                                  style={{ width: `${q.correctPercentage || 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-text-secondary">{q.correctPercentage ?? 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 rounded-full bg-surface-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-red-400"
                                  style={{ width: `${q.incorrectPercentage || 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-text-secondary">{q.incorrectPercentage ?? 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {testAnalytics.batchPerformance && testAnalytics.batchPerformance.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-text-primary mb-3">Batch Performance</h3>
                <div className="overflow-x-auto rounded-xl border border-surface-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-muted border-b border-surface-border">
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Batch</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Average Score</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Attempts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {testAnalytics.batchPerformance.map((b, i) => (
                        <tr key={i} className="hover:bg-surface-muted/50">
                          <td className="px-4 py-3 font-medium text-text-primary">{b.batchName || `Batch ${i + 1}`}</td>
                          <td className="px-4 py-3 text-text-secondary">{b.averageScore != null ? `${b.averageScore}%` : '-'}</td>
                          <td className="px-4 py-3 text-text-secondary">{b.attempts ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {testAnalytics.topicPerformance && testAnalytics.topicPerformance.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-text-primary mb-3">Topic Performance</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {testAnalytics.topicPerformance.map((t, i) => (
                    <div key={i} className="rounded-xl border border-surface-border bg-surface-muted/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">{t.topicName || `Topic ${i + 1}`}</span>
                        <span className={cn(
                          'text-sm font-semibold',
                          (t.accuracy ?? 0) >= 70 ? 'text-green-600' :
                          (t.accuracy ?? 0) >= 40 ? 'text-yellow-600' : 'text-red-600',
                        )}>
                          {t.accuracy != null ? `${t.accuracy}%` : '-'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            (t.accuracy ?? 0) >= 70 ? 'bg-green-500' :
                            (t.accuracy ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500',
                          )}
                          style={{ width: `${t.accuracy || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
