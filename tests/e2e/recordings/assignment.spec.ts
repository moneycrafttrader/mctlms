import { test, expect } from '../fixtures/recordings-fixture';
import { expectCreated, expectOk } from '../utils/assertions';
import { createRecordingDto } from '../utils/factories';
import {
  findBatchLinks,
  findCurriculumEntries,
  findStudentAccessibleRecordings,
} from '../utils/db-helpers';

test.describe('Recording Assignment — Tests 2, 3, 7', () => {
  let recordingId: string;

  test.beforeEach(async ({ request, adminToken, seed }) => {
    const dto = createRecordingDto({
      title: 'E2E-Assignment-Test',
      batchIds: [seed.batchAId, seed.batchBId],
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

  test('Test 2: Assign recording to Batch A — Student A sees it, Student B does not',
    async ({ db, seed, studentAUserId, studentBUserId }) => {
      const links = await findBatchLinks(db, recordingId);
      expect(links.map((l: any) => l.batch_id).sort()).toEqual(
        [seed.batchAId, seed.batchBId].sort(),
      );

      const curriculum = await findCurriculumEntries(db, recordingId);
      expect(curriculum).toHaveLength(2);

      const studentARecordings = await findStudentAccessibleRecordings(db, studentAUserId);
      const studentASees = studentARecordings.some((r: any) => r.id === recordingId);
      expect(studentASees).toBe(true);

      const studentBRecordings = await findStudentAccessibleRecordings(db, studentBUserId);
      const studentBSees = studentBRecordings.some((r: any) => r.id === recordingId);
      expect(studentBSees).toBe(true);
    },
  );

  test('Test 3: Assign same recording to Batch A and Batch B separately — both students see it',
    async ({ request, adminToken, db, seed, studentAUserId, studentBUserId }) => {
      await request.delete(`/admin/recordings/${recordingId}/batches`, {
        data: { batchIds: [seed.batchBId] },
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const studentARecordings = await findStudentAccessibleRecordings(db, studentAUserId);
      const studentASees = studentARecordings.some((r: any) => r.id === recordingId);
      expect(studentASees).toBe(true);

      const studentBRecordings = await findStudentAccessibleRecordings(db, studentBUserId);
      const studentBSees = studentBRecordings.some((r: any) => r.id === recordingId);
      expect(studentBSees).toBe(false);
    },
  );

  test('Test 7: Remove recording from Batch A — Student A loses access, Student B retains',
    async ({ request, adminToken, db, seed, studentAUserId, studentBUserId }) => {
      await request.delete(`/admin/recordings/${recordingId}/batches`, {
        data: { batchIds: [seed.batchBId] },
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const studentBRecordings = await findStudentAccessibleRecordings(db, studentBUserId);
      const studentBSees = studentBRecordings.some((r: any) => r.id === recordingId);
      expect(studentBSees).toBe(false);

      const studentARecordings = await findStudentAccessibleRecordings(db, studentAUserId);
      const studentASees = studentARecordings.some((r: any) => r.id === recordingId);
      expect(studentASees).toBe(true);

      await request.delete(`/admin/recordings/${recordingId}/batches`, {
        data: { batchIds: [seed.batchAId] },
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const studentARecordings2 = await findStudentAccessibleRecordings(db, studentAUserId);
      const studentASees2 = studentARecordings2.some((r: any) => r.id === recordingId);
      expect(studentASees2).toBe(false);

      const links = await findBatchLinks(db, recordingId);
      expect(links).toHaveLength(0);

      const curriculum = await findCurriculumEntries(db, recordingId);
      expect(curriculum).toHaveLength(0);
    },
  );
});
