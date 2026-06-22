import { fetchApi } from '@/lib/api-client';

export interface EmailLogEntry {
  id: string;
  recipient_email: string;
  subject: string;
  template_name: string | null;
  template_type: string | null;
  provider: string;
  provider_message_id: string | null;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  error_message: string | null;
  metadata: Record<string, any> | null;
  retry_count: number;
  max_retries: number;
  last_retry_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLogListResponse {
  items: EmailLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface EmailLogStats {
  total: number;
  sent: number;
  failed: number;
  retrying: number;
  pending: number;
  templateCounts: Record<string, number>;
}

export interface EmailLogAnalytics {
  total: number;
  sent: number;
  failed: number;
  deliveryRate: number;
  failureRate: number;
  emailsPerDay: { date: string; count: number }[];
  mostUsedTemplates: { name: string; count: number }[];
}

export async function getEmailLogs(params: {
  page?: number;
  limit?: number;
  status?: string;
  templateName?: string;
  recipientSearch?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.templateName) query.set('templateName', params.templateName);
  if (params.recipientSearch) query.set('recipientSearch', params.recipientSearch);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const qs = query.toString();
  return fetchApi<EmailLogListResponse>(`/email-logs${qs ? `?${qs}` : ''}`);
}

export async function getEmailStats() {
  return fetchApi<EmailLogStats>('/email-logs/stats');
}

export async function getEmailAnalytics() {
  return fetchApi<EmailLogAnalytics>('/email-logs/analytics');
}

export interface EmailQueueStats {
  total: number;
  pending: number;
  retrying: number;
  failed: number;
  inQueue: number;
}

export async function getEmailQueueStats() {
  return fetchApi<EmailQueueStats>('/email-logs/queue');
}

export async function retryEmail(id: string) {
  return fetchApi<{ message: string }>(`/email-logs/${id}/retry`, {
    method: 'POST',
  });
}
