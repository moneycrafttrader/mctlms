'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Laptop,
  Shield,
  ShieldCheck,
  Trash2,
  Pencil,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { getDevices, updateDevice, deleteDevice, type UserDevice } from '@/lib/api/devices';

function getDeviceIcon(device: UserDevice) {
  const os = (device.os ?? '').toLowerCase();
  const browser = (device.browser ?? '').toLowerCase();
  if (os.includes('android') || os.includes('ios')) return Smartphone;
  if (browser.includes('chrome') || browser.includes('edge') || browser.includes('firefox') || browser.includes('safari')) return Laptop;
  return Monitor;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / 60000);
        return `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export function DeviceList() {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDevices();
      setDevices(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleToggleTrust = async (device: UserDevice) => {
    try {
      const updated = await updateDevice(device.id, { isTrusted: !device.isTrusted });
      setDevices((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update device');
    }
  };

  const handleRename = async (deviceId: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await updateDevice(deviceId, { name: editName.trim() });
      setDevices((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to rename device');
    }
  };

  const handleDelete = async (deviceId: string) => {
    try {
      await deleteDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      setDeletingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove device');
    }
  };

  if (loading) {
    return (
      <div className="rounded-card border border-surface-border bg-surface-card p-5">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-surface-border bg-surface-card">
      <div className="border-b border-surface-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Devices</h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Devices that have logged into your account
            </p>
          </div>
          <button
            onClick={loadDevices}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-navy hover:bg-surface-muted transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {devices.length === 0 && !loading ? (
        <div className="px-5 py-8 text-center">
          <Monitor className="mx-auto h-8 w-8 text-text-muted" />
          <p className="mt-2 text-sm text-text-muted">No devices registered yet</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-border">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device);
            const isEditing = editingId === device.id;
            const isDeleting = deletingId === device.id;

            return (
              <div key={device.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                    <Icon className="h-4 w-4 text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Device name"
                          className="block w-full rounded-lg border border-surface-border px-2.5 py-1.5 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(device.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleRename(device.id)}
                          className="flex-shrink-0 rounded-lg bg-brand-navy p-1.5 text-white hover:bg-brand-navyDark"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-shrink-0 rounded-lg bg-surface-muted p-1.5 text-text-secondary hover:bg-surface-border"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {device.name || `${device.browser || 'Unknown browser'} on ${device.os || 'Unknown OS'}`}
                        </span>
                        {device.isTrusted && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Trusted
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                      {device.browser && <span>{device.browser}</span>}
                      {device.os && <span>{device.os}</span>}
                      {device.lastIpAddress && (
                        <span className="font-mono">{device.lastIpAddress}</span>
                      )}
                      <span>{formatDate(device.lastSeenAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(device.id);
                        setEditName(device.name || '');
                      }}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors"
                      title="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleTrust(device)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        device.isTrusted
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-text-muted hover:bg-surface-muted hover:text-text-primary'
                      }`}
                      title={device.isTrusted ? 'Remove trusted status' : 'Mark as trusted'}
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                    {isDeleting ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors"
                          title="Confirm remove"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg bg-surface-muted p-1.5 text-text-secondary hover:bg-surface-border transition-colors"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(device.id)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Force logout this device"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
