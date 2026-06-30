import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _db: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!_db) {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment',
      );
    }
    _db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _db;
}

export async function deleteTestData(db: SupabaseClient, ids: {
  recordingIds?: string[];
  batchIds?: string[];
  userIds?: string[];
  topicIds?: string[];
}) {
  const ops: Promise<unknown>[] = [];

  if (ids.recordingIds?.length) {
    ops.push(
      db.from('batch_recording_curriculum').delete().in('content_id', ids.recordingIds).eq('content_type', 'recording'),
      db.from('recording_batches').delete().in('recording_id', ids.recordingIds),
      db.from('video_progress').delete().in('video_id', ids.recordingIds),
      db.from('recordings').delete().in('id', ids.recordingIds),
    );
  }

  if (ids.batchIds?.length) {
    ops.push(
      db.from('batch_students').delete().in('batch_id', ids.batchIds),
      db.from('recording_batches').delete().in('batch_id', ids.batchIds),
      db.from('batches').delete().in('id', ids.batchIds),
    );
  }

  if (ids.topicIds?.length) {
    ops.push(
      db.from('topics').delete().in('id', ids.topicIds),
    );
  }

  await Promise.all(ops);
}

export async function findRecordingById(db: SupabaseClient, id: string) {
  const { data } = await db.from('recordings').select('*').eq('id', id).single();
  return data;
}

export async function findBatchLinks(db: SupabaseClient, recordingId: string) {
  const { data } = await db.from('recording_batches').select('batch_id').eq('recording_id', recordingId);
  return data ?? [];
}

export async function findCurriculumEntries(db: SupabaseClient, recordingId: string) {
  const { data } = await db
    .from('batch_recording_curriculum')
    .select('*')
    .eq('content_id', recordingId)
    .eq('content_type', 'recording');
  return data ?? [];
}

export async function findStudentAccessibleRecordings(
  db: SupabaseClient,
  userId: string,
) {
  const { data: memberships } = await db
    .from('batch_students')
    .select('batch_id')
    .eq('user_id', userId);

  const batchIds = (memberships ?? []).map((b: any) => b.batch_id);
  if (!batchIds.length) return [];

  const { data: links } = await db
    .from('recording_batches')
    .select('recording_id')
    .in('batch_id', batchIds);

  const recordingIds = [...new Set((links ?? []).map((l: any) => l.recording_id))];
  if (!recordingIds.length) return [];

  const { data: recordings } = await db
    .from('recordings')
    .select('*')
    .in('id', recordingIds);

  return recordings ?? [];
}

export async function findProgress(db: SupabaseClient, userId: string, recordingId: string) {
  const { data } = await db
    .from('video_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('video_id', recordingId)
    .maybeSingle();
  return data;
}
