import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BatchAccessService } from './batch-access.service';
import { SupabaseService } from './supabase.service';
import { UserRole } from '@lms/shared-types';
import { TABLES } from '../constants/tables.constant';

function mockQuery(resolveTo: any) {
  const q: any = {
    select: jest.fn(() => q),
    eq: jest.fn(() => q),
    in: jest.fn(() => q),
    limit: jest.fn(() => q),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };
  q.maybeSingle.mockResolvedValue(resolveTo);
  q.single.mockResolvedValue(resolveTo);
  q.then = (onF: any) => Promise.resolve(resolveTo).then(onF);
  return q;
}

describe('BatchAccessService', () => {
  let service: BatchAccessService;
  let client: any;

  beforeEach(async () => {
    client = { from: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchAccessService,
        { provide: SupabaseService, useValue: { client } },
      ],
    }).compile();
    service = module.get(BatchAccessService);
  });

  it('assertTeacherBatchAccess throws Forbidden when not assigned', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_TEACHERS) {
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(service.assertTeacherBatchAccess('teacher-1', 'batch-x')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('assertStudentBatchAccess throws NotFound when not enrolled', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_STUDENTS) {
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(service.assertStudentBatchAccess('student-1', 'batch-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assertBatchReadAccess allows admin without DB check', async () => {
    await expect(
      service.assertBatchReadAccess({ id: 'a1', role: UserRole.ADMIN }, 'batch-x'),
    ).resolves.toBeUndefined();
    expect(client.from).not.toHaveBeenCalled();
  });

  it('assertTeacherBatchesAccess rejects any failing batch in bulk', async () => {
    let calls = 0;
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_TEACHERS) {
        calls++;
        if (calls === 1) {
          return mockQuery({ data: { batch_id: 'b1' }, error: null });
        }
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(
      service.assertTeacherBatchesAccess('t1', ['b1', 'b2']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertTeacherCanViewUserProfile denies unrelated student', async () => {
    let call = 0;
    client.from.mockImplementation((table: string) => {
      call++;
      if (table === TABLES.BATCH_TEACHERS && call === 1) {
        return mockQuery({ data: [{ batch_id: 'b1' }], error: null });
      }
      if (table === TABLES.BATCH_STUDENTS) {
        return mockQuery({ data: [], error: null });
      }
      if (table === TABLES.BATCH_TEACHERS) {
        return mockQuery({ data: [], error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(service.assertTeacherCanViewUserProfile('t1', 'stranger')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});