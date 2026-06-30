import { nextSeq } from './counter';

function tag(prefix: string): string {
  return `${prefix}-${String(nextSeq()).padStart(3, '0')}`;
}

export function createRecordingDto(overrides?: Partial<{
  title: string;
  description: string;
  batchIds: string[];
  categoryName: string;
  moduleName: string;
  isPublished: boolean;
  titleOverride: string;
}>): Record<string, unknown> {
  return {
    title: overrides?.title ?? tag('E2E-Recording'),
    description: overrides?.description ?? 'Created by E2E test',
    batchIds: overrides?.batchIds ?? [],
    categoryName: overrides?.categoryName ?? 'General',
    moduleName: overrides?.moduleName ?? null,
    isPublished: overrides?.isPublished ?? true,
    titleOverride: overrides?.titleOverride ?? null,
  };
}

export function updateCurriculumDto(
  assignments: Array<{
    batchId: string;
    sectionName?: string;
    sortOrder?: number;
    isVisible?: boolean;
    assigned?: boolean;
  }>,
): Record<string, unknown> {
  return { assignments };
}

export function updateRecordingDto(overrides?: Partial<{
  title: string;
  description: string;
  topicId: string | null;
}>): Record<string, unknown> {
  return {
    title: overrides?.title ?? tag('E2E-Updated'),
    description: overrides?.description ?? 'Updated description',
    topicId: overrides?.topicId ?? null,
  };
}

export function updateProgressDto(watchedSeconds: number, completed = false): Record<string, unknown> {
  return { watchedSeconds, completed };
}
