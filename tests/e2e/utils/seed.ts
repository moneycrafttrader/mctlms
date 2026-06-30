import { getDb } from './db-helpers';
import { nextSeq } from './counter';

export interface SeedContext {
  batchAId: string;
  batchBId: string;
  topicId: string;
}

export async function seedTestData(): Promise<SeedContext> {
  const db = getDb();
  const seq = nextSeq();

  const batchAId = crypto.randomUUID();
  const batchBId = crypto.randomUUID();
  const topicId = crypto.randomUUID();

  await db.from('topics').insert({
    id: topicId,
    name: `E2E-Topic-${String(seq).padStart(3, '0')}`,
    sort_order: 0,
  });

  await db.from('batches').insert([
    { id: batchAId, name: `E2E-Batch-A-${String(seq).padStart(3, '0')}`, description: 'Test batch A', status: 'active' },
    { id: batchBId, name: `E2E-Batch-B-${String(seq).padStart(3, '0')}`, description: 'Test batch B', status: 'active' },
  ]);

  return { batchAId, batchBId, topicId };
}

export async function enrollStudentInBatch(
  db: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  batchId: string,
): Promise<void> {
  await db.from('batch_students').insert({
    user_id: userId,
    batch_id: batchId,
  });
}

export async function teardownTestData(context: SeedContext): Promise<void> {
  const db = getDb();

  await Promise.all([
    db.from('batch_students').delete().in('batch_id', [context.batchAId, context.batchBId]),
    db.from('batches').delete().in('id', [context.batchAId, context.batchBId]),
    db.from('topics').delete().eq('id', context.topicId),
  ]);
}
