import { test, expect } from '../fixtures/recordings-fixture';
import { expectCreated, expectOk } from '../utils/assertions';
import { createRecordingDto, updateCurriculumDto } from '../utils/factories';
import { findCurriculumEntries } from '../utils/db-helpers';

test.describe('Curriculum Customization — Test 4', () => {
  let recordingId: string;

  test.beforeEach(async ({ request, adminToken, seed }) => {
    const dto = createRecordingDto({
      title: 'E2E-Curriculum-Test',
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

  test('customizes curriculum per batch — section, sort order, visibility', async ({
    request, adminToken, db, seed, studentAToken, studentBToken,
  }) => {
    const dto = updateCurriculumDto([
      {
        batchId: seed.batchAId,
        sectionName: 'Swing Trading',
        sortOrder: 1,
        isVisible: true,
        assigned: true,
      },
      {
        batchId: seed.batchBId,
        sectionName: 'Advanced',
        sortOrder: 8,
        isVisible: false,
        assigned: true,
      },
    ]);

    const res = await request.patch(`/admin/recordings/${recordingId}/batch-curriculum`, {
      data: dto,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await expectOk(res);

    const entries = await findCurriculumEntries(db, recordingId);
    expect(entries).toHaveLength(2);

    const batchAEntry = entries.find((e: any) => e.batch_id === seed.batchAId);
    expect(batchAEntry).toBeTruthy();
    expect(batchAEntry!.category_name).toBe('Swing Trading');
    expect(batchAEntry!.sort_order).toBe(1);
    expect(batchAEntry!.is_published).toBe(true);

    const batchBEntry = entries.find((e: any) => e.batch_id === seed.batchBId);
    expect(batchBEntry).toBeTruthy();
    expect(batchBEntry!.category_name).toBe('Advanced');
    expect(batchBEntry!.sort_order).toBe(8);
    expect(batchBEntry!.is_published).toBe(false);

    const groupResA = await request.get('/recordings/my/grouped', {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    const groupA = (await expectOk(groupResA)).data as any[];

    const batchAGroup = groupA.find((g: any) => g.batchId === seed.batchAId);
    expect(batchAGroup).toBeTruthy();
    const swingSection = batchAGroup!.sections.find(
      (s: any) => s.sectionName === 'Swing Trading',
    );
    expect(swingSection).toBeTruthy();
    const recordingInSectionA = swingSection.recordings.find(
      (r: any) => r.id === recordingId,
    );
    expect(recordingInSectionA).toBeTruthy();

    const groupResB = await request.get('/recordings/my/grouped', {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    const groupB = (await expectOk(groupResB)).data as any[];

    const batchBGroup = groupB.find((g: any) => g.batchId === seed.batchBId);
    if (batchBGroup) {
      for (const section of batchBGroup.sections) {
        const hidden = section.recordings.find((r: any) => r.id === recordingId);
        expect(hidden).toBeFalsy();
      }
    }
  });
});
