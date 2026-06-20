import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface ZoomSignatureResponse {
  signature: string;
  sdkKey: string;
  meetingNumber: string;
  role: number;
}

export async function getZoomSignature(
  meetingNumber: string,
  role: number,
  token?: string,
) {
  return fetchApi<ZoomSignatureResponse>(API_ROUTES.ZOOM_SIGNATURE, {
    method: 'POST',
    body: JSON.stringify({ meetingNumber, role }),
    token,
  });
}
