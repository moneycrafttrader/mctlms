'use client';

import Link from 'next/link';
import {
  Users,
  BookOpen,
  IndianRupee,
  Calendar,
  Clock,
  FileText,
  Video,
  UserPlus,
  ChevronRight,
  ExternalLink,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageContainer } from '@/components/shared/PageContainer';
import { ROUTES } from '@/lib/constants';

interface AdminDashboardClientProps {
  studentCount: number;
  totalRevenue: number;
  activeCourses: number;
  upcomingSessions: { id: string; topic: string; start_time: string; duration_minutes: number; status?: string }[];
  reviewCount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const recentActivityColumns = [
  { key: 'type', label: 'Type' },
  { key: 'detail', label: 'Detail' },
  { key: 'time', label: 'Time' },
];

const recentActivityData = [
  { type: 'Enrollment', detail: 'Rahul S. enrolled in Options Mastery', time: '2 min ago' },
  { type: 'Completion', detail: 'Nisha K. completed Technical Analysis', time: '15 min ago' },
  { type: 'Submission', detail: 'Arjun M. submitted Test #4', time: '1h ago' },
  { type: 'Enrollment', detail: 'Priya R. enrolled in Futures Trading', time: '2h ago' },
  { type: 'Review', detail: 'Vikram J. test awaiting review', time: '3h ago' },
];

const quickActions = [
  { label: 'Create Test', href: ROUTES.ADMIN.TESTS_NEW, icon: FileText, color: 'bg-blue-50 text-blue-600' },
  { label: 'Schedule Session', href: ROUTES.ADMIN.SESSIONS, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  { label: 'Upload Recording', href: ROUTES.ADMIN.RECORDINGS, icon: Video, color: 'bg-amber-50 text-amber-600' },
  { label: 'Add Student', href: ROUTES.ADMIN.STUDENTS, icon: UserPlus, color: 'bg-green-50 text-green-600' },
];

export function AdminDashboardClient({
  studentCount,
  totalRevenue,
  activeCourses,
  upcomingSessions,
  reviewCount,
}: AdminDashboardClientProps) {
  const revenueTrend = totalRevenue > 0 ? 'up' : 'down';
  const pendingReviews = reviewCount;

  return (
    <>
      <PageContainer maxWidth="xl">
        <div className="space-y-6">
          {/* ── Top Row: Stat Cards ── */}
          <div className="animate-fade-in-up">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Card padding="md" hover>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Total Students</span>
                  <div className="rounded-lg bg-brand-50 p-2">
                    <Users className="h-4 w-4 text-brand-600" />
                  </div>
                </div>
                <p className="stat-value mt-2">{studentCount.toLocaleString('en-IN')}</p>
                <p className="mt-1 text-2xs text-text-muted">Active enrolled users</p>
              </Card>

              <Card padding="md" hover>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Active Courses</span>
                  <div className="rounded-lg bg-blue-50 p-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <p className="stat-value mt-2">{activeCourses}</p>
                <p className="mt-1 text-2xs text-text-muted">Currently running</p>
              </Card>

              <Card padding="md" hover>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Revenue</span>
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <p className="stat-value mt-2">{formatCurrency(totalRevenue)}</p>
                <div className="mt-1 flex items-center gap-1 text-2xs">
                  {revenueTrend === 'up' ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600">+12% vs last month</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-600">No revenue data</span>
                    </>
                  )}
                </div>
              </Card>

              <Card padding="md" hover>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Upcoming Sessions</span>
                  <div className="rounded-lg bg-purple-50 p-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="stat-value mt-2">{upcomingSessions.length}</p>
                <p className="mt-1 text-2xs text-text-muted">Next 7 days</p>
              </Card>

              <Card padding="md" hover>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Pending Reviews</span>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <ClipboardCheck className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <p className="stat-value mt-2">{pendingReviews}</p>
                {pendingReviews > 0 && (
                  <Link href={ROUTES.ADMIN.REVIEW_QUEUE} className="mt-1 inline-flex items-center gap-1 text-2xs font-medium text-amber-600 hover:text-amber-700">
                    Review now <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </Card>
            </div>
          </div>

          {/* ── Recent Activity + Quick Actions ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="animate-fade-in-up lg:col-span-2" style={{ animationDelay: '80ms' }}>
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
                  <span className="text-2xs text-text-muted">Live feed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {recentActivityColumns.map((col) => (
                          <th key={col.key} className="table-header">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivityData.map((row, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell">
                            <Badge
                              variant={
                                row.type === 'Enrollment' ? 'info' :
                                row.type === 'Completion' ? 'success' : 'warning'
                              }
                              size="sm"
                            >
                              {row.type}
                            </Badge>
                          </td>
                          <td className="table-cell text-text-primary font-medium">{row.detail}</td>
                          <td className="table-cell text-2xs">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="animate-fade-in-up space-y-3" style={{ animationDelay: '160ms' }}>
              <h3 className="text-sm font-semibold text-text-primary">Quick Actions</h3>
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Card padding="md" hover>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-text-primary">{action.label}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Upcoming Sessions ── */}
          <div className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Upcoming Sessions</h3>
                <Link href={ROUTES.ADMIN.SESSIONS} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Manage sessions
                </Link>
              </div>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-2">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 rounded-xl border border-surface-border p-3 transition-colors hover:bg-surface-muted/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                        <Calendar className="h-5 w-5 text-brand-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{session.topic}</p>
                        <div className="mt-0.5 flex items-center gap-3 text-2xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.start_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(session.start_time)}
                          </span>
                          <span>{session.duration_minutes} min</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          session.status === 'live' ? 'error' :
                          session.status === 'scheduled' ? 'info' : 'neutral'
                        }
                        size="sm"
                      >
                        {session.status === 'live' ? 'LIVE' : session.status === 'scheduled' ? 'Scheduled' : 'Upcoming'}
                      </Badge>
                      <ExternalLink className="h-4 w-4 shrink-0 text-text-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-text-muted" />
                  <p className="mt-2 text-sm text-text-secondary">No upcoming sessions scheduled</p>
                </div>
              )}
            </Card>
          </div>

          {/* ── Pending Reviews ── */}
          {pendingReviews > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
              <Link href={ROUTES.ADMIN.REVIEW_QUEUE}>
                <Card padding="lg" hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                        <ClipboardCheck className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">Pending Reviews</h3>
                        <p className="text-xs text-text-muted">{pendingReviews} test{pendingReviews > 1 ? 's' : ''} awaiting evaluation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-amber-100 px-2 text-sm font-bold text-amber-700">
                        {pendingReviews}
                      </span>
                      <ChevronRight className="h-5 w-5 text-text-muted" />
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
