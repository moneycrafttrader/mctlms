import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface CreateRecordingData {
  title: string;
  description?: string;
  videoUrl?: string;
  batchIds: string[];
}

export interface Recording {
  id: string;
  title: string;
  description?: string;
  mux_asset_id?: string;
  mux_playback_id?: string;
  duration_seconds?: number;
  status: string;
  created_at: string;
  batchNames: string[];
  batchIds: string[];
}

export interface CreateRecordingWithUploadResponse {
  recording: Recording;
  uploadUrl: string;
}

export async function createRecording(
  data: CreateRecordingData,
) {
  return fetchApi<CreateRecordingWithUploadResponse>(API_ROUTES.ADMIN_RECORDINGS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getRecordings() {
  return fetchApi<Recording[]>(API_ROUTES.ADMIN_RECORDINGS);
}

// ── Batch Curriculum ─────────────────────────────────────────

export interface CurriculumItem {
  id: string;
  batch_id: string;
  recording_id: string;
  category_name: string;
  module_name?: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  recordings?: Recording;
}

export interface CurriculumCategory {
  category: string;
  items: CurriculumItem[];
}

export interface AddCurriculumItemData {
  recordingId: string;
  categoryName: string;
  moduleName?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface UpdateCurriculumItemData {
  categoryName?: string;
  moduleName?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

/**
 * Get curriculum for a batch, grouped by category.
 * GET /admin/batch-curriculum/:batchId
 */
export async function getBatchCurriculum(batchId: string) {
  return fetchApi<CurriculumCategory[]>(
    `${API_ROUTES.ADMIN_BATCH_CURRICULUM}/${batchId}`,
  );
}

/**
 * Add a recording to a batch's curriculum.
 * POST /admin/batch-curriculum/:batchId
 */
export async function addCurriculumItem(
  batchId: string,
  data: AddCurriculumItemData,
) {
  return fetchApi<CurriculumItem>(
    `${API_ROUTES.ADMIN_BATCH_CURRICULUM}/${batchId}`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

/**
 * Update a curriculum item.
 * PATCH /admin/batch-curriculum/:id
 */
export async function updateCurriculumItem(
  id: string,
  data: UpdateCurriculumItemData,
) {
  return fetchApi<CurriculumItem>(
    `${API_ROUTES.ADMIN_BATCH_CURRICULUM}/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

/**
 * Remove a curriculum item.
 * DELETE /admin/batch-curriculum/:id
 */
export async function removeCurriculumItem(id: string) {
  return fetchApi<{ deleted: boolean }>(
    `${API_ROUTES.ADMIN_BATCH_CURRICULUM}/${id}`,
    { method: 'DELETE' },
  );
}

/**
 * Reorder curriculum items within a batch.
 * PATCH /admin/batch-curriculum/:batchId/reorder
 */
export async function reorderCurriculum(
  batchId: string,
  items: { id: string; sortOrder: number }[],
) {
  return fetchApi<{ reordered: boolean }>(
    `${API_ROUTES.ADMIN_BATCH_CURRICULUM}/${batchId}/reorder`,
    { method: 'PATCH', body: JSON.stringify({ items }) },
  );
}
