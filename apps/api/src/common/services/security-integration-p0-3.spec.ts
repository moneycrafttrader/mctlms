import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { BatchAccessService } from './batch-access.service';
import { TestsService } from '../../modules/tests/tests.service';
import { AttendanceService } from '../../modules/attendance/attendance.service';
import { BatchCurriculumService } from '../../modules/batch-curriculum/batch-curriculum.service';
import { RecordingsService } from '../../modules/recordings/recordings.service';
import { batchAccessServiceMock } from './batch-access.service.mock';
import { TABLES } from '../constants/tables.constant';

function mockQuery(resolveTo: unknown) {
  const q: Record<string, unknown> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
    limit: jest.fn().mockReturnThis(),
  };
  (q.maybeSingle as jest.Mock).mockResolvedValue(resolveTo);
  (q.single as jest.Mock).mockResolvedValue(resolveTo);
  (q as { then?: (fn: (v: unknown) => unknown) => Promise<unknown> }).then = (onF) =>
    Promise.resolve(resolveTo).then(onF);
  return q;
}

/**
 * Phase A — security integration checks (mocked DB, real service authorization paths).
 */
describe('P0-3 security integration verification', () => {
  describe('multi-batch test write', () => {
    it('denies teacher when test spans a batch they do not teach', async () => {
      const client = { from: jest.fn() };
      const batchAccess = {
        assertTeacherTestWriteAccess: jest.fn().mockImplementation(async (teacherId: string, testId: string) => {
          if (testId === 'test-multi') {
            throw new ForbiddenException('You cannot modify this test');
          }
        }),
        assertTeacherTestBatchAssignments: jest.fn(),
      };
      const tests = new TestsService(
        { client } as never,
        {} as never,
        batchAccess as never,
      );
      await expect(
        tests.update('test-multi', { title: 'Hack' }, { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('attendance unassigned session', () => {
    it('denies teacher session attendance outside assigned batches', async () => {
      batchAccessServiceMock.assertTeacherSessionAccess.mockRejectedValueOnce(
        new ForbiddenException('You do not have access to this session'),
      );
      const attendance = new AttendanceService({ client: { from: jest.fn() } } as never, batchAccessServiceMock as never);
      await expect(
        attendance.getSessionAttendance('session-foreign', { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('recording batch IDOR', () => {
    it('denies teacher batch recordings on unassigned batch', async () => {
      batchAccessServiceMock.assertTeacherBatchAccess.mockRejectedValueOnce(
        new ForbiddenException('You are not assigned to this batch'),
      );
      const recordings = new RecordingsService(
        { client: { from: jest.fn() } } as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        batchAccessServiceMock as never,
        { getOrThrow: () => ({ get: jest.fn() }) } as never,
      );
      await expect(
        recordings.getBatchRecordings('batch-foreign', { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('student unenrolled curriculum', () => {
    it('returns NotFound when student is not enrolled in batch', async () => {
      let call = 0;
      const client = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === TABLES.BATCH_STUDENTS) {
            return mockQuery({ data: null, error: null });
          }
          call++;
          return mockQuery({ data: null, error: null });
        }),
      };
      const batchAccess = new BatchAccessService({ client } as never);
      const curriculum = new BatchCurriculumService({ client } as never, batchAccess);
      await expect(
        curriculum.findPublished('batch-x', { id: 's1', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});