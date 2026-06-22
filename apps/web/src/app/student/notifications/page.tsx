'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Award, FileText, CheckCircle, UserPlus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/lib/api/notifications';

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '< 1 min ago';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

const ICON_MAP: Record<string, typeof Bell> = {
  announcement: Bell,
  achievement_earned: Award,
  certificate_issued: FileText,
  course_completed: CheckCircle,
  batch_assigned: UserPlus,
};

function getTypeIcon(type: string) {
  return ICON_MAP[type] ?? Bell;
}

const ICON_BG: Record<string, string> = {
  announcement: 'bg-blue-500/10 text-blue-600',
  achievement_earned: 'bg-yellow-500/10 text-yellow-600',
  certificate_issued: 'bg-green-500/10 text-green-600',
  course_completed: 'bg-emerald-500/10 text-emerald-600',
  batch_assigned: 'bg-violet-500/10 text-violet-600',
};

function getIconColors(type: string) {
  return ICON_BG[type] ?? 'bg-slate-500/10 text-slate-500';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifs, unread] = await Promise.all([
        getMyNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(unread.unreadCount);
    } catch {
      // API unavailable — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.isRead) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAsRead(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, [notifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);

    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch {
      setNotifications(previous);
      setUnreadCount(previous.filter((n) => !n.isRead).length);
    } finally {
      setMarkingAll(false);
    }
  }, [notifications, unreadCount, markingAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-xs text-text-muted">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-navy transition-colors hover:bg-brand-navy/5 disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-surface-border p-8 text-center">
          <Bell className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            No notifications yet
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            You&apos;ll see announcements, achievements, and updates here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = getTypeIcon(notif.type);

            return (
              <button
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={cn(
                  'w-full text-left rounded-card border border-surface-border bg-surface-card p-4 transition-colors',
                  !notif.isRead && 'border-l-2 border-l-brand-navy bg-surface-muted/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      getIconColors(notif.type),
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={cn(
                        'text-sm text-text-primary',
                        !notif.isRead && 'font-semibold',
                      )}
                    >
                      {notif.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="mt-1.5 inline-block text-2xs text-text-muted">
                      {getRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-navy" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
