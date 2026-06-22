import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface CertificateVerification {
  valid: boolean;
  certificate: {
    id: string;
    studentName: string;
    courseName: string;
    issueDate: string;
    expiryDate?: string;
    certificateUrl?: string;
  };
}

export interface CertificateStatus {
  id: string;
  status: 'pending' | 'issued' | 'revoked' | 'expired';
  studentName: string;
  courseName: string;
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
}

export async function verifyCertificate(token: string) {
  const query = new URLSearchParams({ token });
  return fetchApi<CertificateVerification>(
    `${API_ROUTES.CERTIFICATE_VERIFY}?${query.toString()}`,
  );
}

export async function getCertificateStatus(id: string) {
  return fetchApi<CertificateStatus>(
    `${API_ROUTES.CERTIFICATE_STATUS}/${id}/status`,
  );
}
