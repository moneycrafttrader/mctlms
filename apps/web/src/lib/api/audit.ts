import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorName?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function getAuditLogs(
  params: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    action?: string;
    actorId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.entityId) query.set('entityId', params.entityId);
  if (params.action) query.set('action', params.action);
  if (params.actorId) query.set('actorId', params.actorId);
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const qs = query.toString();
  const endpoint = `${API_ROUTES.ADMIN_AUDIT_LOGS}${qs ? `?${qs}` : ''}`;

  return fetchApi<AuditLogResponse>(endpoint);
}
