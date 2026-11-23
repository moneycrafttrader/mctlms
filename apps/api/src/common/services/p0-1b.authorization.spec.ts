import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { BatchAccessService } from './batch-access.service';
import { SupabaseService } from './supabase.service';
import { RecordingsService } from '../../modules/recordings/recordings.service';
import { TestsService } from '../../modules/tests/tests.service';
import { AttendanceService } from '../../modules/attendance/attendance.service';
import { ResultsService } from '../../modules/results/results.service';
import { CurriculumProgressService } from '../../modules/curriculum-progress/curriculum-progress.service';
import { ObservabilityService } from '../../modules/observability/observability.service';
import { RedisCacheService } from './redis-cache.service';
import { PlaybackGuardService } from '../../modules/playback/playback-guard.service';
import { RecordingProviderResolver } from '../../modules/video-provider/recording-provider.resolver';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { batchAccessServiceMock } from './batch-access.service.mock';

describe('P0-1B teacher authorization', () => {
  describe('RecordingsService.getBatchRecordings', () => {
    let recordings: RecordingsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RecordingsService,
          { provide: SupabaseService, useValue: { client: { from: jest.fn() } } },
          { provide: PlaybackGuardService, useValue: {} },
          { provide: ObservabilityService, useValue: {} },
          { provide: RedisCacheService, useValue: {} },
          { provide: RecordingProviderResolver, useValue: { resolveUploadProvider: jest.fn(), resolve: jest.fn() } },
          {
            provide: RedisService,
            useValue: { getOrThrow: () => ({ get: jest.fn(), setex: jest.fn(), del: jest.fn() }) },
          },
          { provide: BatchAccessService, useValue: batchAccessServiceMock },
        ],
      }).compile();
      recordings = module.get(RecordingsService);
      jest.clearAllMocks();
    });

    it('denies teacher on unassigned batch', async () => {
      batchAccessServiceMock.assertTeacherBatchAccess.mockRejectedValueOnce(
        new ForbiddenException('You are not assigned to this batch'),
      );
      await expect(
        recordings.getBatchRecordings('batch-x', { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('TestsService.findOne', () => {
    let tests: TestsService;
    let client: any;

    beforeEach(async () => {
      client = { from: jest.fn() };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TestsService,
          { provide: SupabaseService, useValue: { client } },
          { provide: ObservabilityService, useValue: {} },
          { provide: BatchAccessService, useValue: batchAccessServiceMock },
        ],
      }).compile();
      tests = module.get(TestsService);
      jest.clearAllMocks();
    });

    it('denies teacher on unauthorized test before query', async () => {
      batchAccessServiceMock.assertTeacherTestReadAccess.mockRejectedValueOnce(
        new ForbiddenException('You do not have access to this test'),
      );
      await expect(
        tests.findOne('test-x', { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe('AttendanceService.getBatchAttendanceReport', () => {
    let attendance: AttendanceService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AttendanceService,
          { provide: SupabaseService, useValue: { client: { from: jest.fn() } } },
          { provide: BatchAccessService, useValue: batchAccessServiceMock },
        ],
      }).compile();
      attendance = module.get(AttendanceService);
      jest.clearAllMocks();
    });

    it('denies teacher on unrelated batch', async () => {
      batchAccessServiceMock.assertTeacherBatchAccess.mockRejectedValueOnce(
        new ForbiddenException('You are not assigned to this batch'),
      );
      await expect(
        attendance.getBatchAttendanceReport('batch-x', undefined, {
          id: 't1',
          role: UserRole.TEACHER,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('ResultsService.getTestAnalytics', () => {
    let results: ResultsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ResultsService,
          { provide: SupabaseService, useValue: { client: { from: jest.fn() } } },
          { provide: BatchAccessService, useValue: batchAccessServiceMock },
        ],
      }).compile();
      results = module.get(ResultsService);
      jest.clearAllMocks();
    });

    it('denies teacher on unauthorized test analytics', async () => {
      batchAccessServiceMock.assertTeacherTestReadAccess.mockRejectedValueOnce(
        new ForbiddenException('You do not have access to this test'),
      );
      await expect(
        results.getTestAnalytics('test-x', { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('CurriculumProgressService.getAdminProgress', () => {
    let progress: CurriculumProgressService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CurriculumProgressService,
          { provide: SupabaseService, useValue: { client: { from: jest.fn() } } },
          { provide: BatchAccessService, useValue: batchAccessServiceMock },
        ],
      }).compile();
      progress = module.get(CurriculumProgressService);
      jest.clearAllMocks();
    });

    it('denies teacher on unassigned batch progress admin view', async () => {
      batchAccessServiceMock.assertBatchReadAccess.mockRejectedValueOnce(
        new ForbiddenException('You are not assigned to this batch'),
      );
      await expect(
        progress.getAdminProgress('batch-x', { id: 't1', role: UserRole.TEACHER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});