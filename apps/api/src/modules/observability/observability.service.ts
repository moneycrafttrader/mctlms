import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';
import { LogErrorDto } from './dto/log-error.dto';
import { LogEventDto } from './dto/log-event.dto';
import { TrackMetricDto } from './dto/track-metric.dto';

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async logError(dto: LogErrorDto, userId?: string) {
    const { error } = await this.supabaseService.client
      .from(TABLES.SYSTEM_ERRORS)
      .insert({
        message: dto.message,
        error_type: dto.errorType,
        severity: dto.severity ?? 'error',
        stack_trace: dto.stackTrace ?? null,
        context: dto.context ?? null,
        user_id: userId ?? dto.userId ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to log error: ${error.message}`);
    }
  }

  async logEvent(dto: LogEventDto) {
    const { error } = await this.supabaseService.client
      .from(TABLES.SYSTEM_EVENTS)
      .insert({
        event_type: dto.eventType,
        source: dto.source,
        severity: dto.severity ?? 'info',
        message: dto.message,
        metadata: dto.metadata ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to log event: ${error.message}`);
    }
  }

  async trackMetric(dto: TrackMetricDto) {
    const { error } = await this.supabaseService.client
      .from(TABLES.PERFORMANCE_METRICS)
      .insert({
        metric_name: dto.metricName,
        metric_value: dto.value,
        unit: dto.unit ?? 'ms',
        tags: dto.tags ?? null,
        endpoint: dto.tags?.endpoint ?? null,
        method: dto.tags?.method ?? null,
        user_id: dto.userId ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to track metric: ${error.message}`);
    }
  }

  async getErrors(params: {
    page?: number;
    limit?: number;
    errorType?: string;
    severity?: string;
    resolved?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabaseService.client
      .from(TABLES.SYSTEM_ERRORS)
      .select('*', { count: 'exact' });

    if (params.errorType) {
      query = query.eq('error_type', params.errorType);
    }
    if (params.severity) {
      query = query.eq('severity', params.severity);
    }
    if (params.resolved !== undefined) {
      query = query.eq('resolved', params.resolved);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.error(`Failed to fetch errors: ${error.message}`);
      return { items: [], total: 0, page, limit };
    }

    return { items: data ?? [], total: count ?? 0, page, limit };
  }

  async getEvents(params: {
    page?: number;
    limit?: number;
    eventType?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabaseService.client
      .from(TABLES.SYSTEM_EVENTS)
      .select('*', { count: 'exact' });

    if (params.eventType) {
      query = query.eq('event_type', params.eventType);
    }
    if (params.source) {
      query = query.eq('source', params.source);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.error(`Failed to fetch events: ${error.message}`);
      return { items: [], total: 0, page, limit };
    }

    return { items: data ?? [], total: count ?? 0, page, limit };
  }

  async getMetrics(params: {
    metricName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = this.supabaseService.client
      .from(TABLES.PERFORMANCE_METRICS)
      .select('metric_name, metric_value, unit, tags, endpoint, method, created_at');

    if (params.metricName) {
      query = query.eq('metric_name', params.metricName);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch metrics: ${error.message}`);
      return { metricName: params.metricName ?? 'all', values: [], count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const rows = data ?? [];
    const values = rows.map((r: any) => Number(r.metric_value)).filter((v: number) => !isNaN(v));
    const count = values.length;

    if (count === 0) {
      return { metricName: params.metricName ?? 'all', values: [], count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      metricName: params.metricName ?? 'all',
      values,
      count,
      avg: +(sum / count).toFixed(2),
      min: sorted[0],
      max: sorted[count - 1],
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  async getDashboard() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [recentErrorsResult, errorTypeCountsResult, error24hResult, event24hResult, metricsResult, totalMetricsResult] =
      await Promise.all([
        this.supabaseService.client
          .from(TABLES.SYSTEM_ERRORS)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),

        this.supabaseService.client
          .from(TABLES.SYSTEM_ERRORS)
          .select('error_type'),

        this.supabaseService.client
          .from(TABLES.SYSTEM_ERRORS)
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twentyFourHoursAgo),

        this.supabaseService.client
          .from(TABLES.SYSTEM_EVENTS)
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twentyFourHoursAgo),

        this.supabaseService.client
          .from(TABLES.PERFORMANCE_METRICS)
          .select('metric_value, tags')
          .eq('metric_name', 'endpoint_latency'),

        this.supabaseService.client
          .from(TABLES.PERFORMANCE_METRICS)
          .select('id', { count: 'exact', head: true }),
      ]);

    const recentErrors = recentErrorsResult.data ?? [];
    const errorRows = errorTypeCountsResult.data ?? [];
    const errorCountsLast24h = (error24hResult as any).count ?? 0;
    const eventCountsLast24h = (event24hResult as any).count ?? 0;
    const metricRows = metricsResult.data ?? [];
    const totalMetrics = (totalMetricsResult as any).count ?? 0;

    const errorCountsByTypeMap = new Map<string, number>();
    for (const row of errorRows as any[]) {
      const t = row.error_type ?? 'unknown';
      errorCountsByTypeMap.set(t, (errorCountsByTypeMap.get(t) ?? 0) + 1);
    }
    const errorCountsByType = Array.from(errorCountsByTypeMap.entries()).map(
      ([errorType, count]) => ({ errorType, count }),
    );

    const endpointLatencyMap = new Map<string, { total: number; count: number }>();
    for (const row of metricRows as any[]) {
      const endpoint = row.tags?.endpoint ?? 'unknown';
      const val = Number(row.metric_value);
      if (isNaN(val)) continue;
      const entry = endpointLatencyMap.get(endpoint) ?? { total: 0, count: 0 };
      entry.total += val;
      entry.count += 1;
      endpointLatencyMap.set(endpoint, entry);
    }

    const slowestEndpoints = Array.from(endpointLatencyMap.entries())
      .map(([endpoint, { total, count }]) => ({
        endpoint,
        avgLatency: +(total / count).toFixed(2),
        count,
      }))
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 5);

    return {
      recentErrors,
      errorCountsByType,
      errorCountsLast24h,
      eventCountsLast24h,
      slowestEndpoints,
      totalMetrics,
    };
  }
}
