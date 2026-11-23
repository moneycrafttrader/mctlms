import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BatchCurriculumService } from './batch-curriculum.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { BatchAccessService } from '../../common/services/batch-access.service';
import { UserRole } from '@lms/shared-types';
import { TABLES } from '../../common/constants/tables.constant';

function mockQuery(resolveTo: any) {
  const q: any = {
    select: jest.fn(() => q),
    eq: jest.fn(() => q),
    order: jest.fn(() => q),
    maybeSingle: jest.fn(),
  };
  q.maybeSingle.mockResolvedValue(resolveTo);
  q.then = (onF: any) => Promise.resolve(resolveTo).then(onF);
  return q;
}

describe('BatchCurriculumService — authorization (P0-1)', () => {
  let service: BatchCurriculumService;
  let client: any;

  beforeEach(async () => {
    client = { from: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchCurriculumService,
        BatchAccessService,
        { provide: SupabaseService, useValue: { client } },
      ],
    }).compile();
    service = module.get(BatchCurriculumService);
  });

  it('findPublished denies student not enrolled (NotFound)', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_STUDENTS) {
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: [], error: null });
    });
    await expect(
      service.findPublished('batch-x', { id: 'student-1', role: UserRole.STUDENT }),
    ).rejects.toThrow();
  });

  it('add denies teacher on unassigned batch', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_TEACHERS) {
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(
      service.add('batch-x', { contentType: 'pdf', pdfTitle: 'T' } as any, {
        id: 'teacher-1',
        role: UserRole.TEACHER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});