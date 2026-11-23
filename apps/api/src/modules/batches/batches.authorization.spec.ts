import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { BatchAccessService } from '../../common/services/batch-access.service';
import { EmailService } from '../email/email.service';
import { ObservabilityService } from '../observability/observability.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { UserRole } from '@lms/shared-types';
import { TABLES } from '../../common/constants/tables.constant';

function mockQuery(resolveTo: any) {
  const q: any = {
    select: jest.fn(() => q),
    eq: jest.fn(() => q),
    in: jest.fn(() => q),
    range: jest.fn(() => q),
    order: jest.fn(() => q),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };
  q.maybeSingle.mockResolvedValue(resolveTo);
  q.single.mockResolvedValue(resolveTo);
  q.then = (onF: any) => Promise.resolve(resolveTo).then(onF);
  return q;
}

describe('BatchesService — teacher authorization (P0-1)', () => {
  let service: BatchesService;
  let client: any;

  beforeEach(async () => {
    client = { from: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        BatchAccessService,
        { provide: SupabaseService, useValue: { client } },
        { provide: EmailService, useValue: {} },
        { provide: ObservabilityService, useValue: { logEvent: jest.fn() } },
        { provide: RedisCacheService, useValue: {} },
      ],
    }).compile();
    service = module.get(BatchesService);
  });

  it('findById denies teacher on unassigned batch', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_TEACHERS) {
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(
      service.findById('batch-foreign', { id: 'teacher-1', role: UserRole.TEACHER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getStudents denies teacher on unassigned batch', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_TEACHERS) {
        return mockQuery({ data: null, error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    await expect(
      service.getStudents('batch-foreign', 1, 50, { id: 'teacher-1', role: UserRole.TEACHER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});