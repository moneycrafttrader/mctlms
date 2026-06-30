import { test, expect } from '../fixtures/recordings-fixture';
import { expectCreated, expectOk } from '../utils/assertions';
import { createRecordingDto } from '../utils/factories';
import { findRecordingById, findBatchLinks, findCurriculumEntries } from '../utils/db-helpers';

test.describe('Delete & Cleanup — Tests 8, 9, 10', () => {
  let recordingId: string;

  test.afterEach(async ({ db }) => {
    if (recordingId) {
      await db.from('batch_recording_curriculum').delete().eq('content_id', recordingId).eq('content_type', 'recording');
      await db.from('recording_batches').delete().eq('recording_id', recordingId);
      await db.from('recordings').delete().eq('id', recordingId);
    }
  });

  test('Test 8: Delete recording — no student sees it, DB cleaned', async ({
    request, adminToken, seed, db, studentAToken,
  }) => {
    const dto = createRecordingDto({
      title: 'E2E-Delete-Test',
      batchIds: [seed.batchAId, seed.batchBId],
    });
    const res = await request.post('/admin/recordings', {
      data: dto,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const wrapper = await expectCreated(res);
    recordingId = ((wrapper.data as Record<string, unknown>).recording as Record<string, unknown>).id as string;

    const delRes = await request.delete(`/admin/recordings/${recordingId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const result = (await expectOk(delRes)).data as Record<string, unknown>;
    expect(result.deleted).toBe(true);

    const dbRecording = await findRecordingById(db, recordingId);
    if (dbRecording) {
      expect(dbRecording.cleanup_pending).toBe(true);
    }

    const links = await findBatchLinks(db, recordingId);
    expect(links).toHaveLength(0);

    const curriculum = await findCurriculumEntries(db, recordingId);
    expect(curriculum).toHaveLength(0);

    const studentARes = await request.get('/recordings/my', {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    const studentAData = (await expectOk(studentARes)).data as any[];
    const stillVisible = studentAData.some((r: any) => r.id === recordingId);
    expect(stillVisible).toBe(false);
  });

  test('Test 9: Concurrent admin assignment — no duplicate rows', async ({
    request, adminToken, seed, db,
  }) => {
    const dto = createRecordingDto({
      title: 'E2E-Concurrent-Test',
      batchIds: [seed.batchAId],
    });
    const res = await request.post('/admin/recordings', {
      data: dto,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const wrapper = await expectCreated(res);
    recordingId = ((wrapper.data as Record<string, unknown>).recording as Record<string, unknown>).id as string;

    const assignA = request.post(`/admin/recordings/${recordingId}/batches`, {
      data: { batchIds: [seed.batchAId, seed.batchBId] },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const assignB = request.post(`/admin/recordings/${recordingId}/batches`, {
      data: { batchIds: [seed.batchBId] },
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    await Promise.all([assignA, assignB]);

    const links = await findBatchLinks(db, recordingId);
    const batchIds = links.map((l: any) => l.batch_id);
    const uniqueBatchIds = [...new Set(batchIds)];
    expect(batchIds.length).toBe(uniqueBatchIds.length);
    expect(batchIds.sort()).toEqual([seed.batchAId, seed.batchBId].sort());

    const curriculum = await findCurriculumEntries(db, recordingId);
    const curriculumBatchIds = curriculum.map((c: any) => c.batch_id);
    const uniqueCurriculumBatchIds = [...new Set(curriculumBatchIds)];
    expect(curriculumBatchIds.length).toBe(uniqueCurriculumBatchIds.length);
    expect(curriculumBatchIds.sort()).toEqual([seed.batchAId, seed.batchBId].sort());
  });

  test('Test 10: Full regression cycle — upload → assign → customize → remove → reassign → delete',
    async ({ request, adminToken, seed, db }) => {
      const dto = createRecordingDto({
        title: 'E2E-Regression-Cycle',
        batchIds: [seed.batchAId],
      });
      const res = await request.post('/admin/recordings', {
        data: dto,
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const wrapper = await expectCreated(res);
      recordingId = ((wrapper.data as Record<string, unknown>).recording as Record<string, unknown>).id as string;

      const assignRes = await request.post(`/admin/recordings/${recordingId}/batches`, {
        data: { batchIds: [seed.batchBId] },
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      await expectOk(assignRes);

      let links = await findBatchLinks(db, recordingId);
      expect(links).toHaveLength(2);

      const curriculumRes = await request.patch(`/admin/recordings/${recordingId}/batch-curriculum`, {
        data: {
          assignments: [
            { batchId: seed.batchAId, sectionName: 'Swing', sortOrder: 1, isVisible: true, assigned: true },
            { batchId: seed.batchBId, sectionName: 'Advanced', sortOrder: 5, isVisible: false, assigned: true },
          ],
        },
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      await expectOk(curriculumRes);

      let curriculum = await findCurriculumEntries(db, recordingId);
      expect(curriculum).toHaveLength(2);

      const batchACurriculum = curriculum.find((c: any) => c.batch_id === seed.batchAId);
      expect(batchACurriculum!.category_name).toBe('Swing');
      expect(batchACurriculum!.sort_order).toBe(1);

      const removeRes = await request.delete(`/admin/recordings/${recordingId}/batches`, {
        data: { batchIds: [seed.batchAId] },
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      await expectOk(removeRes);

      links = await findBatchLinks(db, recordingId);
      expect(links).toHaveLength(1);
      expect(links[0].batch_id).toBe(seed.batchBId);

      curriculum = await findCurriculumEntries(db, recordingId);
      expect(curriculum).toHaveLength(1);
      expect(curriculum[0].batch_id).toBe(seed.batchBId);

      const reassignRes = await request.post(`/admin/recordings/${recordingId}/batches`, {
        data: { batchIds: [seed.batchAId] },
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      await expectOk(reassignRes);

      links = await findBatchLinks(db, recordingId);
      expect(links).toHaveLength(2);

      const delRes = await request.delete(`/admin/recordings/${recordingId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const result = (await expectOk(delRes)).data as Record<string, unknown>;
      expect(result.deleted).toBe(true);

      const dbRec = await findRecordingById(db, recordingId);
      expect(dbRec).toBeNull();

      links = await findBatchLinks(db, recordingId);
      expect(links).toHaveLength(0);

      curriculum = await findCurriculumEntries(db, recordingId);
      expect(curriculum).toHaveLength(0);
    },
  );
});
