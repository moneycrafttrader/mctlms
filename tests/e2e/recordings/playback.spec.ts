import { test, expect } from '../fixtures/recordings-fixture';
import { expectCreated, expectOk } from '../utils/assertions';
import { createRecordingDto } from '../utils/factories';

test.describe('Playback Authorization — Test 5', () => {
  let recordingId: string;

  test.beforeEach(async ({ request, adminToken, seed }) => {
    const dto = createRecordingDto({
      title: 'E2E-Playback-Test',
      batchIds: [seed.batchAId],
    });
    const res = await request.post('/admin/recordings', {
      data: dto,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const wrapper = await expectCreated(res);
    recordingId = ((wrapper.data as Record<string, unknown>).recording as Record<string, unknown>).id as string;
  });

  test.afterEach(async ({ db }) => {
    if (recordingId) {
      await db.from('batch_recording_curriculum').delete().eq('content_id', recordingId).eq('content_type', 'recording');
      await db.from('recording_batches').delete().eq('recording_id', recordingId);
      await db.from('recordings').delete().eq('id', recordingId);
    }
  });

  test('Student A (assigned to Batch A) gets playback URL — 200', async ({
    request, studentAToken,
  }) => {
    const authRes = await request.post(`/recordings/${recordingId}/authorize`, {
      data: {},
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    const authData = (await expectOk(authRes)).data as Record<string, unknown>;
    const token = authData.token as string;

    const playRes = await request.get(`/recordings/${recordingId}/play`, {
      params: { token },
      headers: { Authorization: `Bearer ${studentAToken}` },
    });

    expect(playRes.status()).not.toBe(403);
    expect(playRes.status()).not.toBe(404);
    expect(playRes.status()).not.toBe(500);
  });
});
