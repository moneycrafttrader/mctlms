import { Test, TestingModule } from '@nestjs/testing';
import { RecordingCleanupJob } from './recording-cleanup.job';
import { SupabaseService } from '../common/services/supabase.service';
import { MuxService } from '../modules/mux/mux.service';
import { ObservabilityService } from '../modules/observability/observability.service';

const terminalEq = jest.fn().mockResolvedValue({ data: null, error: null });

function mockChain() {
  const mutationChain = { eq: terminalEq };
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.upsert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(mutationChain);
  chain.delete = jest.fn().mockReturnValue(mutationChain);
  return chain;
}

describe('RecordingCleanupJob', () => {
  let job: RecordingCleanupJob;
  let supabase: any;
  let muxService: any;
  let observabilityService: any;
  let chain: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    chain = mockChain();
    supabase = { client: { from: jest.fn().mockReturnValue(chain) } };
    muxService = { deleteAsset: jest.fn() };
    observabilityService = { logEvent: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordingCleanupJob,
        { provide: SupabaseService, useValue: supabase },
        { provide: MuxService, useValue: muxService },
        { provide: ObservabilityService, useValue: observabilityService },
      ],
    }).compile();

    job = module.get<RecordingCleanupJob>(RecordingCleanupJob);
  });

  it('should return zeros when no recordings are pending cleanup', async () => {
    chain.limit.mockResolvedValue({ data: [], error: null });

    const summary = await job.processCleanupQueue();

    expect(summary.processed).toBe(0);
    expect(summary.deleted).toBe(0);
    expect(muxService.deleteAsset).not.toHaveBeenCalled();
  });

  it('should delete recording when Mux deletion succeeds', async () => {
    chain.limit.mockResolvedValue({
      data: [{ id: 'rec-1', mux_asset_id: 'mux-1', title: 'Test', retry_count: 0 }],
      error: null,
    });
    muxService.deleteAsset.mockResolvedValue(undefined);

    const summary = await job.processCleanupQueue();

    expect(summary.processed).toBe(1);
    expect(summary.deleted).toBe(1);
    expect(muxService.deleteAsset).toHaveBeenCalledWith('mux-1');
    expect(observabilityService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'RECORDING_CLEANUP_COMPLETED' }),
    );
  });

  it('should delete recording when Mux returns 404 (handled by MuxService)', async () => {
    chain.limit.mockResolvedValue({
      data: [{ id: 'rec-2', mux_asset_id: 'mux-2', title: 'Test 2', retry_count: 0 }],
      error: null,
    });
    muxService.deleteAsset.mockResolvedValue(undefined);

    const summary = await job.processCleanupQueue();

    expect(summary.deleted).toBe(1);
    expect(muxService.deleteAsset).toHaveBeenCalledWith('mux-2');
    expect(observabilityService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'RECORDING_CLEANUP_COMPLETED' }),
    );
  });

  it('should retry when Mux deletion fails with 5xx', async () => {
    chain.limit.mockResolvedValue({
      data: [{ id: 'rec-3', mux_asset_id: 'mux-3', title: 'Test 3', retry_count: 0 }],
      error: null,
    });
    const muxError = new Error('Mux API timeout');
    (muxError as any).status = 502;
    muxService.deleteAsset.mockRejectedValue(muxError);

    const summary = await job.processCleanupQueue();

    expect(summary.processed).toBe(1);
    expect(summary.retried).toBe(1);
    expect(summary.deleted).toBe(0);
    expect(terminalEq).toHaveBeenCalledWith('id', 'rec-3');
    expect(observabilityService.logEvent).not.toHaveBeenCalled();
  });

  it('should retry when Mux deletion fails with network timeout', async () => {
    chain.limit.mockResolvedValue({
      data: [{ id: 'rec-4', mux_asset_id: 'mux-4', title: 'Test 4', retry_count: 1 }],
      error: null,
    });
    muxService.deleteAsset.mockRejectedValue(new Error('connect ETIMEDOUT'));

    const summary = await job.processCleanupQueue();

    expect(summary.retried).toBe(1);
    expect(summary.deleted).toBe(0);
    expect(terminalEq).toHaveBeenCalledWith('id', 'rec-4');
  });

  it('should mark cleanup_failed when retry limit is reached', async () => {
    chain.limit.mockResolvedValue({
      data: [{ id: 'rec-5', mux_asset_id: 'mux-5', title: 'Test 5', retry_count: 9 }],
      error: null,
    });
    muxService.deleteAsset.mockRejectedValue(new Error('Mux persistent error'));

    const summary = await job.processCleanupQueue();

    expect(summary.processed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.deleted).toBe(0);
    expect(observabilityService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'RECORDING_CLEANUP_FAILED' }),
    );
  });

  it('should delete orphan recording rows without mux_asset_id', async () => {
    chain.limit.mockResolvedValue({
      data: [{ id: 'rec-6', mux_asset_id: null, title: 'Orphan', retry_count: 0 }],
      error: null,
    });

    const summary = await job.processCleanupQueue();

    expect(summary.deleted).toBe(1);
    expect(muxService.deleteAsset).not.toHaveBeenCalled();
  });

  it('should process multiple recordings sequentially', async () => {
    chain.limit.mockResolvedValue({
      data: [
        { id: 'rec-a', mux_asset_id: 'mux-a', title: 'A', retry_count: 0 },
        { id: 'rec-b', mux_asset_id: 'mux-b', title: 'B', retry_count: 0 },
        { id: 'rec-c', mux_asset_id: 'mux-c', title: 'C', retry_count: 0 },
      ],
      error: null,
    });
    muxService.deleteAsset.mockResolvedValue(undefined);

    const summary = await job.processCleanupQueue();

    expect(summary.processed).toBe(3);
    expect(summary.deleted).toBe(3);
    expect(muxService.deleteAsset).toHaveBeenCalledTimes(3);
  });

  it('should handle Supabase query error gracefully', async () => {
    chain.limit.mockResolvedValue({ data: null, error: { message: 'DB connection lost' } });

    const summary = await job.processCleanupQueue();

    expect(summary.processed).toBe(0);
    expect(summary.deleted).toBe(0);
    expect(muxService.deleteAsset).not.toHaveBeenCalled();
  });
});
