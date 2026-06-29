import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { MuxService } from '../mux/mux.service';
import { PlaybackGuardService } from '../playback/playback-guard.service';
import { ObservabilityService } from '../observability/observability.service';
import { RedisService } from '@liaoliaots/nestjs-redis';

function mockResolvedQuery(result: any) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
}

function mockChain(fromResult?: any) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnValue(fromResult),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.range.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.upsert.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data: null, error: null });
  chain.maybeSingle.mockResolvedValue({ data: null, error: null });

  return chain;
}

describe('RecordingsService', () => {
  let service: RecordingsService;
  let supabase: any;
  let playbackGuard: any;
  let chain: any;

  function setupQuery(results: any[]) {
    let callIndex = 0;
    chain.from.mockImplementation(() => {
      const result = results[callIndex];
      callIndex++;

      const q = mockChain();
      if (result && typeof result === 'object') {
        if (result.data !== undefined) {
          q.single.mockResolvedValue(result);
          q.maybeSingle.mockResolvedValue(result);
          q.eq.mockReturnThis();
          q.in.mockReturnValue({
            in: jest.fn().mockResolvedValue(result),
          });
          q.eq.mockImplementation(() => ({
            in: jest.fn().mockResolvedValue(result),
          }));
        }
      }
      return q;
    });
  }

  beforeEach(async () => {
    chain = mockChain(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordingsService,
        {
          provide: SupabaseService,
          useValue: {
            client: chain,
            authClient: chain,
          },
        },
        {
          provide: MuxService,
          useValue: {
            createUploadUrl: jest.fn(),
            deleteAsset: jest.fn().mockResolvedValue(undefined),
            getSignedPlaybackUrl: jest.fn(),
            getSignedThumbnailUrl: jest.fn(),
          },
        },
        {
          provide: PlaybackGuardService,
          useValue: {
            authorize: jest.fn().mockResolvedValue({
              playbackToken: 'mock-token',
              sessionId: 'mock-session',
              expiresInSeconds: 14400,
            }),
          },
        },
        {
          provide: ObservabilityService,
          useValue: {
            logEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue({
              get: jest.fn(),
              setex: jest.fn(),
              del: jest.fn(),
              expire: jest.fn(),
              incr: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RecordingsService>(RecordingsService);
    supabase = module.get(SupabaseService);
    playbackGuard = module.get(PlaybackGuardService);
    jest.clearAllMocks();
  });

  describe('authorizePlayback - student assigned to batch', () => {
    it('should authorize when student is in a batch linked to the recording', async () => {
      const recordingId = 'rec-1';
      const userId = 'user-1';

      let callIndex = 0;
      chain.from.mockImplementation(() => {
        const q = mockChain();
        const idx = callIndex;
        callIndex++;

        if (idx === 0) {
          q.single.mockResolvedValue({
            data: { id: recordingId, status: 'ready' },
            error: null,
          });
        } else if (idx === 1) {
          q.eq.mockResolvedValue({
            data: [{ batch_id: 'batch-1' }],
            error: null,
          });
        } else if (idx === 2) {
          q.eq.mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ batch_id: 'batch-1' }],
              error: null,
            }),
          });
        }
        return q;
      });

      const result = await service.authorizePlayback(recordingId, userId);

      expect(result).toBeDefined();
      expect(result.playbackToken).toBe('mock-token');
    });
  });

  describe('authorizePlayback - student not assigned', () => {
    it('should throw ForbiddenException when student is not assigned to any batch', async () => {
      const recordingId = 'rec-1';
      const userId = 'user-1';

      let callIndex = 0;
      chain.from.mockImplementation((table: string) => {
        const q = mockChain(null);
        if (callIndex === 0) {
          q.single.mockResolvedValueOnce({
            data: { id: recordingId, status: 'ready' },
            error: null,
          });
        } else if (callIndex === 1) {
          // batch_students: empty
          q.eq.mockImplementation(() => ({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }));
        }
        callIndex++;
        return q;
      });

      await expect(
        service.authorizePlayback(recordingId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when recording is not linked to student batches', async () => {
      const recordingId = 'rec-1';
      const userId = 'user-1';

      let callIndex = 0;
      chain.from.mockImplementation((table: string) => {
        const q = mockChain(null);
        if (callIndex === 0) {
          q.single.mockResolvedValueOnce({
            data: { id: recordingId, status: 'ready' },
            error: null,
          });
        } else if (callIndex === 1) {
          // batch_students: has membership in 'other-batch'
          q.eq.mockImplementation(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ batch_id: 'other-batch' }],
              error: null,
            }),
          }));
        } else if (callIndex === 2) {
          // recording_batches: no match → empty
          q.eq.mockImplementation(() => ({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }));
        }
        callIndex++;
        return q;
      });

      await expect(
        service.authorizePlayback(recordingId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('authorizePlayback - recording not ready', () => {
    it('should throw BadRequestException when recording status is processing', async () => {
      chain.from.mockImplementation(() => {
        const q = mockChain(null);
        q.single.mockResolvedValueOnce({
          data: { id: 'rec-1', status: 'processing' },
          error: null,
        });
        return q;
      });

      await expect(
        service.authorizePlayback('rec-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when recording status is failed', async () => {
      chain.from.mockImplementation(() => {
        const q = mockChain(null);
        q.single.mockResolvedValueOnce({
          data: { id: 'rec-1', status: 'failed' },
          error: null,
        });
        return q;
      });

      await expect(
        service.authorizePlayback('rec-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('authorizePlayback - recording not found', () => {
    it('should throw NotFoundException when recording does not exist', async () => {
      chain.from.mockImplementation(() => {
        const q = mockChain(null);
        q.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        });
        return q;
      });

      await expect(
        service.authorizePlayback('rec-nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignToBatches - syncs curriculum', () => {
    it('should create recording_batches and curriculum entries', async () => {
      const upsertMock = jest.fn().mockResolvedValue({ data: null, error: null });
      upsertMock.mockResolvedValueOnce({ data: null, error: null });
      upsertMock.mockResolvedValueOnce({ data: null, error: null });

      chain.from.mockReturnValue({
        upsert: upsertMock,
      });

      const result = await service.assignToBatches('rec-1', ['batch-1', 'batch-2']);

      expect(result.assignedCount).toBe(2);
      expect(upsertMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeBatchAccess - syncs curriculum', () => {
    it('should delete from recording_batches and curriculum', async () => {
      const deleteMock = jest.fn().mockResolvedValue({ data: null, error: null });
      chain.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await service.removeBatchAccess('rec-1', ['batch-1']);

      expect(result.removedCount).toBe(1);
    });
  });

  describe('deleteRecording - syncs curriculum', () => {
    it('should delete curriculum entries before deleting recording', async () => {
      const recordingId = 'rec-1';

      let callIndex = 0;
      chain.from.mockImplementation(() => {
        const q = mockChain();
        const idx = callIndex;
        callIndex++;

        if (idx === 0) {
          q.single.mockResolvedValue({
            data: { id: recordingId, mux_asset_id: 'mux-1', title: 'Test' },
            error: null,
          });
        } else if (idx === 1) {
          q.delete.mockReturnValue(q);
          q.eq
            .mockImplementationOnce(() => q)
            .mockResolvedValueOnce({ data: null, error: null });
        } else {
          q.delete.mockReturnValue(q);
          q.eq.mockResolvedValue({ data: null, error: null });
        }
        return q;
      });

      const result = await service.deleteRecording(recordingId);

      expect(result.deleted).toBe(true);
    });
  });
});
