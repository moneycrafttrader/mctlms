import { test, expect } from '../fixtures/recordings-fixture';
import { expectCreated } from '../utils/assertions';
import { createRecordingDto } from '../utils/factories';
import { findRecordingById } from '../utils/db-helpers';

test.describe('Recording Upload — Test 1', () => {
  let recordingId: string;

  test.afterEach(async ({ db }) => {
    if (recordingId) {
      await db.from('batch_recording_curriculum').delete().eq('content_id', recordingId).eq('content_type', 'recording');
      await db.from('recording_batches').delete().eq('recording_id', recordingId);
      await db.from('recordings').delete().eq('id', recordingId);
    }
  });

  test('Admin uploads recording — recording row exists, Mux asset created, status processing', async ({
    request, adminToken, seed, db,
  }) => {
    const dto = createRecordingDto({
      title: 'E2E-Upload-Test',
      description: 'Verifying upload pipeline',
      batchIds: [seed.batchAId],
      categoryName: 'Swing Trading',
    });

    const response = await request.post('/admin/recordings', {
      data: dto,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const wrapper = await expectCreated(response);
    const data = wrapper.data as Record<string, unknown>;
    expect(data).toHaveProperty('recording');
    recordingId = (data.recording as Record<string, unknown>).id as string;

    const dbRecording = await findRecordingById(db, recordingId);
    expect(dbRecording).toBeTruthy();
    expect(dbRecording.title).toBe('E2E-Upload-Test');
    expect(dbRecording.status).toBe('processing');
    expect(dbRecording.mux_upload_id).toBeTruthy();

    const { data: links } = await db
      .from('recording_batches')
      .select('batch_id')
      .eq('recording_id', recordingId);
    expect(links).toHaveLength(1);
    expect(links![0].batch_id).toBe(seed.batchAId);

    const { data: curriculum } = await db
      .from('batch_recording_curriculum')
      .select('*')
      .eq('content_id', recordingId)
      .eq('content_type', 'recording');
    expect(curriculum).toHaveLength(1);
    expect(curriculum![0].category_name).toBe('Swing Trading');

    expect(data.uploadUrl).toBeTruthy();
    expect(typeof data.uploadUrl).toBe('string');
    expect(data.uploadUrl).toContain('mux.com');
  });
});
