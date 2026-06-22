'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Video,
  Radio,
  Clock,
  Calendar,
  ExternalLink,
  Loader2,
  PlayCircle,
  Trophy,
  BarChart3,
  TrendingUp,
  Award,
  ChevronRight,
  Zap,
  Flame,
  Target,
  CheckCircle2,
  Medal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageContainer } from '@/components/shared/PageContainer';
import { MobileHeader } from '@/components/shared/MobileHeader';
import { ErrorBoundary } from '@/components/debug/ErrorBoundary';
import { type LiveSession, requestJoinToken, getSessionJoinUrl } from '@/lib/api/live-sessions';
import { type StudentCourse } from '@/lib/api/courses';
import { type StudentVideo } from '@/lib/api/videos';

interface DashboardClientProps {
  name: string;
  nextClass: LiveSession | null;
  upcoming: LiveSession[];
  continueContent: StudentVideo[];
  courses: StudentCourse[];
  recordings: StudentVideo[];
  results: unknown[];
  pastSessions: (LiveSession & { attendanceStatus?: string })[];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 17) return '🌤️';
  return '🌙';
}

function timeUntil(startTime: string) {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

function getCourseProgress(recordings: StudentVideo[]): number {
  if (recordings.length === 0) return 0;
  const withProgress = recordings.filter(r => (r.progress?.watched_seconds ?? 0) > 0).length;
  return Math.round((withProgress / recordings.length) * 100);
}

function getProgressPercent(video: StudentVideo): number {
  const watched = video.progress?.watched_seconds;
  if (!watched) return 0;
  const totalSec = 600;
  return Math.min(100, Math.round((watched / totalSec) * 100));
}

const achievements = [
  { label: 'First Login', icon: Zap, unlocked: true },
  { label: 'Quick Learner', icon: TrendingUp, unlocked: true },
  { label: 'Test Ace', icon: Target, unlocked: false },
  { label: 'Streak Master', icon: Flame, unlocked: false },
  { label: 'Course Complete', icon: Award, unlocked: false },
];

let _renderOrder = 0;
function renderTrace(section: string): null {
  _renderOrder++;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Dashboard:${_renderOrder}] Rendering section: ${section}`);
  }
  return null;
}

export function DashboardClient({ name, nextClass, upcoming, continueContent, courses, recordings, results, pastSessions }: DashboardClientProps) {
  const [greeting, setGreeting] = useState('');
  const [joining, setJoining] = useState(false);
  const [streak] = useState(3);
  const didLog = useRef(false);

  useEffect(() => {
    setGreeting(getGreeting());
    if (process.env.NODE_ENV === 'development' && !didLog.current) {
      didLog.current = true;
      console.log('[Dashboard] Props:', {
        name,
        nextClass: nextClass?.topic || null,
        upcomingCount: upcoming.length,
        continueContentCount: continueContent.length,
        coursesCount: courses.length,
        recordingsCount: recordings.length,
        resultsType: Array.isArray(results) ? `array[${results.length}]` : typeof results,
        resultsKeys: Array.isArray(results) ? 'N/A' : Object.keys(results).join(', '),
      });
    }
  }, []);

  const handleJoin = async () => {
    if (!nextClass) return;
    setJoining(true);
    try {
      const { token } = await requestJoinToken(nextClass.id);
      const { joinUrl } = await getSessionJoinUrl(nextClass.id, token);
      window.open(joinUrl, '_blank');
    } catch {
      // silent
    } finally {
      setJoining(false);
    }
  };

  const isLive = nextClass?.status === 'live';
  const lastResult = results.length > 0 ? (results[0] as Record<string, unknown>) : null;
  const totalWatchedSeconds = recordings.reduce((acc, r) => acc + (r.progress?.watched_seconds || 0), 0);
  const completedTests = results.length;

  renderTrace('Welcome Header');
  return (
    <ErrorBoundary name="StudentDashboard">
    <>
      <MobileHeader title="Dashboard" />

      <PageContainer>
        <div className="space-y-6">
          {/* ── Welcome Header ── */}
          <div className="animate-fade-in-up">
            <div className="flex flex-col gap-4 rounded-card-lg bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-5 text-white md:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getGreetingEmoji()}</span>
                    <h1 className="text-xl font-bold md:text-2xl">
                      {greeting}, <span className="text-gradient from-brand-200 to-white bg-clip-text text-transparent">{name}</span>
                    </h1>
                  </div>
                  <p className="mt-1 text-sm text-brand-200">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-bold">{streak}</span>
                  <span className="text-2xs text-brand-200">day streak</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm">
                  <BookOpen className="h-3.5 w-3.5 text-brand-300" />
                  <span>{courses.length} Courses</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm">
                  <Video className="h-3.5 w-3.5 text-brand-300" />
                  <span>{recordings.length} Videos</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Continue Learning ── */}
          {renderTrace('Continue Learning')}
          <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">
                {continueContent.length > 0 && continueContent.some((c) => c.progress.watched_seconds > 0) ? 'Continue Learning' : 'Trending Now'}
              </h2>
              {recordings.length > 0 && (
                <Link href="/student/videos" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  See all
                </Link>
              )}
            </div>
            {continueContent.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {continueContent.slice(0, 8).map((item) => (
                  <Link key={item.id} href={`/student/videos/${item.id}`} className="shrink-0">
                    <Card className="w-44" padding="none">
                      <div className="relative flex aspect-video items-center justify-center rounded-t-card bg-gradient-to-br from-brand-100 to-brand-50">
                        <PlayCircle className="h-8 w-8 text-brand-400/60" />
                        {item.progress?.watched_seconds > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-border">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${getProgressPercent(item)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-2xs text-text-muted">
                          {item.progress?.watched_seconds > 0 ? (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>{secondsToMinutes(item.progress.watched_seconds)}m watched</span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1">
                              <PlayCircle className="h-3 w-3" />
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <Video className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-2 text-sm text-text-secondary">No recordings available yet</p>
              </Card>
            )}
          </div>

          {/* ── Upcoming Class ── */}
          {renderTrace('Upcoming Class')}
          <div className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              {isLive ? '🔴 Live Now' : nextClass ? 'Upcoming Class' : 'No Upcoming Classes'}
            </h2>
            {nextClass ? (
              <Card className="relative overflow-hidden" padding="lg" hover>
                {isLive && (
                  <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-card bg-red-500 px-3 py-1 text-2xs font-bold text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    LIVE
                  </div>
                )}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isLive ? 'bg-red-50' : 'bg-brand-50')}>
                        <Radio className={cn('h-5 w-5', isLive ? 'text-red-500' : 'text-brand-600')} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-text-primary">{nextClass.topic}</h3>
                        <p className="text-xs text-text-muted">
                          {formatDate(nextClass.start_time)} · {formatTime(nextClass.start_time)} · {nextClass.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    {!isLive && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                        <Clock className="h-3.5 w-3.5" />
                        Starts in {timeUntil(nextClass.start_time)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant={isLive ? 'primary' : 'outline'}
                    size="md"
                    loading={joining}
                    onClick={handleJoin}
                    className={cn(isLive && 'animate-pulse-soft')}
                  >
                    {isLive ? 'Join Now' : 'View Details'}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-8">
                <Calendar className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-2 text-sm text-text-secondary">All caught up! No upcoming classes.</p>
              </Card>
            )}
          </div>

          {/* ── Quick Stats ── */}
          {renderTrace('Quick Stats')}
          <div className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <span className="stat-label">Courses</span>
                  <BookOpen className="h-4 w-4 text-brand-500" />
                </div>
                <p className="stat-value mt-2">{courses.length}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <span className="stat-label">Tests Done</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="stat-value mt-2">{completedTests}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <span className="stat-label">Day Streak</span>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <p className="stat-value mt-2">{streak}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <span className="stat-label">Watched</span>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <p className="stat-value mt-2">{Math.floor(totalWatchedSeconds / 3600)}h</p>
              </div>
            </div>
          </div>

          {/* ── Recent Test ── */}
          {renderTrace('Recent Test')}
          {lastResult && (
            <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Test Result</h2>
              <Card padding="lg" hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                      <Trophy className="h-6 w-6 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{String(lastResult.test_title || lastResult.title || 'Recent Test')}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                        <span>{String(lastResult.obtained_marks || 0)}/{String(lastResult.total_marks || 100)}</span>
                        <Badge variant={Number(lastResult.percentage || 0) >= 40 ? 'success' : 'error'} size="sm">
                          {Number(lastResult.percentage || 0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Link href="/student/results" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    View
                  </Link>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, Number(lastResult.percentage || 0))}%` }}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* ── Progress Overview ── */}
          {renderTrace('Progress Overview')}
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Progress Overview</h2>
              <Link href="/student/courses" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                View all
              </Link>
            </div>
            {courses.length > 0 ? (
              <div className="space-y-3">
                {courses.slice(0, 4).map((course) => (
                  <Link key={course.id} href={`/student/courses/${course.id}`}>
                    <Card padding="md" hover>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                          <BookOpen className="h-4 w-4 text-brand-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">{course.name}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                                <div className="h-full rounded-full bg-brand-500" style={{ width: `${getCourseProgress(recordings)}%` }} />
                              </div>
                            <span className="text-2xs font-medium text-text-muted">In progress</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <BookOpen className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-2 text-sm text-text-secondary">Enroll in a course to track progress</p>
              </Card>
            )}
          </div>

          {/* ── Achievements ── */}
          {renderTrace('Achievements')}
          <div className="animate-fade-in-up" style={{ animationDelay: '480ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Achievements</h2>
              <span className="text-2xs text-text-muted">{achievements.filter((a) => a.unlocked).length}/{achievements.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {achievements.map((a) => (
                <div
                  key={a.label}
                  className={cn(
                    'flex shrink-0 flex-col items-center gap-1.5 rounded-card border p-4 transition-all',
                    a.unlocked
                      ? 'border-brand-200 bg-brand-50'
                      : 'border-surface-border bg-surface-card opacity-50',
                  )}
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', a.unlocked ? 'bg-brand-500 text-white' : 'bg-surface-muted text-text-muted')}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <span className={cn('text-2xs font-medium', a.unlocked ? 'text-brand-700' : 'text-text-muted')}>
                    {a.label}
                  </span>
                  {a.unlocked && <Medal className="h-3 w-3 text-amber-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
    </ErrorBoundary>
  );
}
