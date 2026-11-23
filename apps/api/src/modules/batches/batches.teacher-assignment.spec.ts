import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { BatchAccessService } from '../../common/services/batch-access.service';
import { EmailService } from '../email/email.service';
import { ObservabilityService } from '../observability/observability.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { TABLES } from '../../common/constants/tables.constant';

function mockQuery(resolveTo: unknown) {
  const q: Record<string, unknown> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };
  (q.maybeSingle as jest.Mock).mockResolvedValue(resolveTo);
  (q.single as jest.Mock).mockResolvedValue(resolveTo);
  (q as { then?: (fn: (v: unknown) => unknown) => Promise<unknown> }).then = (onF) =>
    Promise.resolve(resolveTo).then(onF);
  return q;
}

describe('BatchesService — teacher assignment (P0-3)', () => {
  let service: BatchesService;
  let client: { from: jest.Mock };

  beforeEach(async () => {
    client = { from: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: SupabaseService, useValue: { client } },
        { provide: RedisCacheService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: ObservabilityService, useValue: {} },
        {
          provide: BatchAccessService,
          useValue: { assertTeacherBatchAccess: jest.fn(), getTeacherBatchIds: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(BatchesService);
    jest.spyOn(service, 'findById').mockResolvedValue({ id: 'batch-1' } as never);
  });

  it('removeTeachers rejects empty teacherIds', async () => {
    await expect(service.removeTeachers('batch-1', [])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removeTeachers returns removedCount', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === TABLES.BATCH_TEACHERS) {
        return mockQuery({ data: [{ user_id: 't1' }], error: null });
      }
      return mockQuery({ data: null, error: null });
    });
    const result = await service.removeTeachers('batch-1', ['t1']);
    expect(result.removedCount).toBe(1);
  });
});