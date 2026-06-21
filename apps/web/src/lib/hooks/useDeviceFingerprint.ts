'use client';

import { useMemo } from 'react';

export interface DeviceFingerprint {
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) {
    const v = ua.match(/Edg\/([\d.]+)/)?.[1] ?? '';
    return `Edge ${v}`;
  }
  if (ua.includes('Chrome/')) {
    const v = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '';
    return `Chrome ${v}`;
  }
  if (ua.includes('Firefox/')) {
    const v = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '';
    return `Firefox ${v}`;
  }
  if (ua.includes('Safari/')) {
    const v = ua.match(/Version\/([\d.]+)/)?.[1] ?? '';
    return `Safari ${v}`;
  }
  return 'Unknown';
}

function getOS(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Windows NT 10')) return 'Windows 10';
  if (ua.includes('Windows NT 11')) return 'Windows 11';
  if (ua.includes('Mac OS X')) {
    const v = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '';
    return `macOS ${v}`;
  }
  if (ua.includes('Android')) {
    const v = ua.match(/Android ([\d.]+)/)?.[1] ?? '';
    return `Android ${v}`;
  }
  if (ua.includes('like Mac OS X') && ua.includes('CPU')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function getScreenResolution(): string {
  if (typeof window === 'undefined') return 'Unknown';
  return `${window.screen.width}x${window.screen.height}`;
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function getLanguage(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  return navigator.language || 'Unknown';
}

export function useDeviceFingerprint(): DeviceFingerprint | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;
    return {
      browser: getBrowser(),
      os: getOS(),
      screenResolution: getScreenResolution(),
      timezone: getTimezone(),
      language: getLanguage(),
    };
  }, []);
}
