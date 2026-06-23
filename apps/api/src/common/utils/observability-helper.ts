import { ObservabilityService } from '../../modules/observability/observability.service';

export function logEntityEvent(
  observabilityService: ObservabilityService,
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string,
  extras?: Record<string, any>,
) {
  return observabilityService.logEvent({
    eventType,
    source: 'api',
    severity: 'info',
    message: eventType.toLowerCase().replace(/_/g, ' '),
    metadata: {
      entityType,
      entityId,
      actorId,
      createdAt: new Date().toISOString(),
      ...extras,
    },
  });
}
