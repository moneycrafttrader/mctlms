import { fetchApi } from '@/lib/api-client';

export interface UserDevice {
  id: string;
  userId: string;
  fingerprintHash: string;
  browser: string | null;
  os: string | null;
  screenResolution: string | null;
  timezone: string | null;
  language: string | null;
  ipAddress: string | null;
  lastIpAddress: string | null;
  userAgent: string | null;
  isTrusted: boolean;
  name: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export async function getDevices(): Promise<UserDevice[]> {
  return fetchApi<UserDevice[]>('/devices');
}

export async function updateDevice(
  deviceId: string,
  updates: { name?: string; isTrusted?: boolean },
): Promise<UserDevice> {
  return fetchApi<UserDevice>(`/devices/${deviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteDevice(deviceId: string): Promise<void> {
  return fetchApi<void>(`/devices/${deviceId}`, {
    method: 'DELETE',
  });
}
