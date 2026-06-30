import { test, expect } from '../fixtures/recordings-fixture';
import { expectCreated, expectForbidden, expectNotFound } from '../utils/assertions';
import { createRecordingDto } from '../utils/factories';

test.describe('Authorization Edge Cases — Test 5', () => {
  let recordingId: string;

  test.beforeEach(async ({ request, adminToken, seed }) => {
    const dto = createRecordingDto({
      title: 'E2E-Auth-Edge-Case',
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

  test('Student B (not in Batch A) gets 403 on authorize', async ({
    request, studentBToken,
  }) => {
    const res = await request.post(`/recordings/${recordingId}/authorize`, {
      data: {},
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    await expectForbidden(res);
  });

  test('Student B (not in Batch A) gets 403 on playback URL', async ({
    request, studentBToken,
  }) => {
    const res = await request.get(`/recordings/${recordingId}/play`, {
      params: { token: 'some-fake-token' },
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    await expectForbidden(res);
  });

  test('Unauthenticated request gets 401', async ({ request }) => {
    const res = await request.post(`/recordings/${recordingId}/authorize`, {
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test('Invalid recording ID gets 404 on authorize', async ({
    request, studentAToken,
  }) => {
    const res = await request.post('/recordings/00000000-0000-0000-0000-000000000000/authorize', {
      data: {},
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    await expectNotFound(res);
  });
});
