import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { SupabaseService } from '../../common/services/supabase.service';
import { MuxService } from '../mux/mux.service';
import { PlaybackGuardService } from '../playback/playback-guard.service';
import { ObservabilityService } from '../observability/observability.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { TABLES } from '../../common/constants/tables.constant';
import { REDIS_KEYS, REDIS_TTL } from '../../common/constants/redis-keys.constant';
import { Transaction, TransactionStep } from '../../common/utils/transaction.util';
import { logEntityEvent } from '../../common/utils/observability-helper';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { CreateTopicDto } from '../videos/dto/create-topic.dto';
import { RequestUploadDto } from '../videos/dto/request-upload.dto';
import { UpdateBatchCurriculumDto, BatchCurriculumAssignment } from './dto/update-batch-curriculum.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { UpdateVideoProgressDto } from '../videos/dto/update-video-progress.dto';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private readonly redis: Redis;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly muxService: MuxService,
    private readonly playbackGuard: PlaybackGuardService,
    private readonly observabilityService: ObservabilityService,
    private readonly redisCache: RedisCacheService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getOrThrow();
  }

  // ── Topics ────────────────────────────────────────────────

  async createTopic(dto: CreateTopicDto) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.TOPICS)
      .insert({
        name: dto.name,
        description: dto.description ?? null,
        sort_order: dto.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create topic: ${error.message}`);
      throw new BadRequestException('Failed to create topic');
    }

    return data;
  }

  async getTopics() {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.TOPICS)
      .select('*, recordings(count)')
      .order('sort_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch topics: ${error.message}`);
      throw new BadRequestException('Could not retrieve topics');
    }

    return data ?? [];
  }

  async getTopicById(id: string) {
    const { data: topic, error: topicError } = await this.supabaseService.client
      .from(TABLES.TOPICS)
      .select('*')
      .eq('id', id)
      .single();

    if (topicError || !topic) {
      throw new NotFoundException('Topic not found');
    }

    const { data: recordings } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('*')
      .eq('topic_id', id)
      .order('sort_order', { ascending: true });

    return { ...topic, recordings: recordings ?? [] };
  }

  // ── Recording CRUD ────────────────────────────────────────

  async create(dto: CreateRecordingDto) {
    const { data: recording, error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        status: 'ready',
      })
      .select()
      .single();

    if (error || !recording) {
      this.logger.error(`Failed to save recording: ${error?.message}`);
      throw new BadRequestException('Failed to create recording');
    }

    const batchLinks = dto.batchIds.map((batchId) => ({
      recording_id: recording.id,
      batch_id: batchId,
    }));

    const { error: linkError } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .insert(batchLinks);

    if (linkError) {
      await this.supabaseService.client.from(TABLES.RECORDINGS).delete().eq('id', recording.id);
      this.logger.error(`Failed to link recording to batches: ${linkError.message}`);
      throw new BadRequestException('Failed to link recording to batches');
    }

    await this.autoCreateCurriculumEntries(recording.id, dto);

    const { data: batchNames } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('batches!inner(name)')
      .eq('recording_id', recording.id);

    logEntityEvent(
      this.observabilityService,
      'RECORDING_CREATED',
      'recording',
      recording.id,
      'system',
      { title: dto.title, batchIds: dto.batchIds },
    ).catch(() => {});

    await this.redisCache.invalidateRecordingsCache();

    return {
      ...recording,
      batchIds: dto.batchIds,
      batchNames: (batchNames ?? []).map((b: any) => b.batches.name),
    };
  }

  async findAll(page = 1, limit = 20) {
    limit = Math.min(limit, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: recordings, error, count } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.error(`Failed to fetch recordings: ${error.message}`);
      throw new BadRequestException('Could not retrieve recordings');
    }

    if (!recordings || recordings.length === 0) {
      return { items: [], total: count ?? 0, page, limit };
    }

    const recordingIds = recordings.map((r: any) => r.id);

    const { data: links } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('recording_id, batches!inner(name)')
      .in('recording_id', recordingIds);

    const batchMap = new Map<string, string[]>();
    for (const link of links ?? []) {
      const prev = batchMap.get((link as any).recording_id) ?? [];
      prev.push((link as any).batches.name);
      batchMap.set((link as any).recording_id, prev);
    }

    return {
      items: (recordings ?? []).map((r: any) => ({
        ...r,
        batchNames: batchMap.get(r.id) ?? [],
      })),
      total: count ?? 0,
      page,
      limit,
    };
  }

  async createRecordingWithUpload(dto: CreateRecordingDto) {
    const { uploadUrl, uploadId } = await this.muxService.createUploadUrl(
      dto.title,
      '',
    );

    let recordingRow: Record<string, any> | null = null;

    const steps: TransactionStep[] = [
      {
        name: 'insert-recording',
        execute: async () => {
          const { data: recording, error } = await this.supabaseService.client
            .from(TABLES.RECORDINGS)
            .insert({
              title: dto.title,
              description: dto.description ?? null,
              mux_upload_id: uploadId,
              status: 'processing',
            })
            .select()
            .single();

          if (error || !recording) {
            throw new BadRequestException(`Failed to create recording: ${error?.message}`);
          }
          recordingRow = recording;
        },
        rollback: async () => {
          if (recordingRow) {
            await this.supabaseService.client
              .from(TABLES.RECORDINGS)
              .delete()
              .eq('id', recordingRow.id);
          }
        },
      },
      {
        name: 'insert-batch-links',
        execute: async () => {
          const batchRecords = dto.batchIds.map((batchId) => ({
            recording_id: recordingRow!.id,
            batch_id: batchId,
          }));

          const { error: linkError } = await this.supabaseService.client
            .from(TABLES.RECORDING_BATCHES)
            .upsert(batchRecords, { onConflict: 'recording_id,batch_id' });

          if (linkError) {
            throw new BadRequestException(`Failed to link recording to batches: ${linkError.message}`);
          }
        },
        rollback: async () => {
          await this.supabaseService.client
            .from(TABLES.RECORDING_BATCHES)
            .delete()
            .eq('recording_id', recordingRow!.id);
        },
      },
      {
        name: 'insert-curriculum',
        execute: async () => {
          await this.autoCreateCurriculumEntries(recordingRow!.id, dto);
        },
        rollback: async () => {
          await this.supabaseService.client
            .from(TABLES.BATCH_RECORDING_CURRICULUM)
            .delete()
            .eq('content_id', recordingRow!.id)
            .eq('content_type', 'recording');
        },
      },
    ];

    const tx = new Transaction();
    await tx.run(steps);

    await this.redisCache.invalidateRecordingsCache();

    return {
      recording: recordingRow,
      uploadUrl,
    };
  }

  // ── Mux Upload URL ────────────────────────────────────────

  async requestUploadUrl(dto: RequestUploadDto) {
    const { uploadUrl, uploadId } = await this.muxService.createDirectUploadUrl(dto.title);

    const { data: recording, error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .insert({
        title: dto.title,
        mux_upload_id: uploadId,
        status: 'processing',
      })
      .select('id, title, status, created_at')
      .single();

    if (error) {
      this.logger.error(`Failed to create recording: ${error.message}`);
      throw new BadRequestException('Failed to create recording');
    }

    return { uploadUrl, recording };
  }

  // ── Batch Assignment ──────────────────────────────────────

  async assignToBatches(recordingId: string, batchIds: string[]) {
    const records = batchIds.map((batchId) => ({
      recording_id: recordingId,
      batch_id: batchId,
    }));

    const { error } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .upsert(records, { onConflict: 'recording_id,batch_id' });

    if (error) {
      this.logger.error(`Failed to assign recording to batches: ${error.message}`);
      throw new BadRequestException('Failed to assign recording to batches');
    }

    // Sync curriculum entries for consistency
    const curriculumEntries = batchIds.map((batchId) => ({
      batch_id: batchId,
      content_id: recordingId,
      content_type: 'recording',
      category_name: 'General',
      module_name: null,
      title_override: null,
      sort_order: 0,
      is_published: true,
    }));

    const { error: curriculumError } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .upsert(curriculumEntries, { onConflict: 'batch_id,content_id,content_type' });

    if (curriculumError) {
      this.logger.warn(`Failed to sync curriculum entries for recording ${recordingId}: ${curriculumError.message}`);
    }

    await this.redisCache.invalidateRecordingsCache();

    return { assignedCount: batchIds.length };
  }

  async removeBatchAccess(recordingId: string, batchIds: string[]) {
    const { error } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .delete()
      .eq('recording_id', recordingId)
      .in('batch_id', batchIds);

    if (error) {
      this.logger.error(`Failed to remove batch access: ${error.message}`);
      throw new BadRequestException('Failed to remove batch access');
    }

    // Remove curriculum entries for consistency
    const { error: curriculumError } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .delete()
      .eq('content_id', recordingId)
      .eq('content_type', 'recording')
      .in('batch_id', batchIds);

    if (curriculumError) {
      this.logger.warn(`Failed to remove curriculum entries for recording ${recordingId}: ${curriculumError.message}`);
    }

    await this.redisCache.invalidateRecordingsCache();

    return { removedCount: batchIds.length };
  }

  // ── Batch Curriculum (per-batch metadata) ─────────────────

  async updateBatchCurriculum(recordingId: string, dto: UpdateBatchCurriculumDto) {
    const addBatches: string[] = [];
    const removeBatches: string[] = [];

    for (const a of dto.assignments) {
      if (a.assigned === false) {
        removeBatches.push(a.batchId);
      } else {
        addBatches.push(a.batchId);
      }
    }

    if (addBatches.length > 0) {
      const records = addBatches.map((batchId) => ({
        recording_id: recordingId,
        batch_id: batchId,
      }));

      const { error: linkError } = await this.supabaseService.client
        .from(TABLES.RECORDING_BATCHES)
        .upsert(records, { onConflict: 'recording_id,batch_id' });

      if (linkError) {
        this.logger.error(`Failed to add batch links: ${linkError.message}`);
        throw new BadRequestException('Failed to update batch assignments');
      }

      const assignmentMap = new Map<string, BatchCurriculumAssignment>();
      for (const a of dto.assignments) {
        if (a.assigned !== false) assignmentMap.set(a.batchId, a);
      }

      const curriculumEntries = addBatches.map((batchId) => {
        const meta = assignmentMap.get(batchId);
        return {
          batch_id: batchId,
          content_id: recordingId,
          content_type: 'recording',
          category_name: meta?.sectionName ?? 'General',
          sort_order: meta?.sortOrder ?? 0,
          is_published: meta?.isVisible ?? true,
          module_name: null,
          title_override: null,
        };
      });

      const { error: curriculumError } = await this.supabaseService.client
        .from(TABLES.BATCH_RECORDING_CURRICULUM)
        .upsert(curriculumEntries, { onConflict: 'batch_id,content_id,content_type' });

      if (curriculumError) {
        this.logger.warn(`Failed to sync curriculum: ${curriculumError.message}`);
      }
    }

    if (removeBatches.length > 0) {
      const { error: curriculumError } = await this.supabaseService.client
        .from(TABLES.BATCH_RECORDING_CURRICULUM)
        .delete()
        .eq('content_id', recordingId)
        .eq('content_type', 'recording')
        .in('batch_id', removeBatches);

      if (curriculumError) {
        this.logger.warn(`Failed to remove curriculum: ${curriculumError.message}`);
      }

      const { error: linkError } = await this.supabaseService.client
        .from(TABLES.RECORDING_BATCHES)
        .delete()
        .eq('recording_id', recordingId)
        .in('batch_id', removeBatches);

      if (linkError) {
        this.logger.error(`Failed to remove batch links: ${linkError.message}`);
        throw new BadRequestException('Failed to update batch assignments');
      }
    }

    await this.redisCache.invalidateRecordingsCache();

    return { updated: true };
  }

  // ── Update / Delete ───────────────────────────────────────

  async updateRecording(id: string, dto: UpdateRecordingDto) {
    const updateData: Record<string, any> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.topicId !== undefined) updateData.topic_id = dto.topicId;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const { data, error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .update(updateData)
      .eq('id', id)
      .select('*, topics(name)')
      .single();

    if (error || !data) {
      this.logger.error(`Failed to update recording ${id}: ${error?.message}`);
      throw new BadRequestException('Failed to update recording');
    }

    return data;
  }

  async deleteRecording(id: string) {
    const { data: recording } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('id, mux_asset_id, title')
      .eq('id', id)
      .single();

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.mux_asset_id) {
      await this.muxService.deleteAsset(recording.mux_asset_id);
    }

    await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .delete()
      .eq('content_id', id)
      .eq('content_type', 'recording');

    const { error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete recording ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete recording');
    }

    logEntityEvent(
      this.observabilityService,
      'RECORDING_DELETED',
      'recording',
      id,
      'system',
      { title: recording.title },
    ).catch(() => {});

    await this.redisCache.invalidateRecordingsCache();

    return { deleted: true };
  }

  // ── Admin List (paginated, with batch info) ───────────────

  async getAdminRecordings(topicId?: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select(`*, topics(name), ${TABLES.RECORDING_BATCHES}!recording_id(batch_id)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      this.logger.error(`Failed to fetch admin recordings: ${error.message}`);
      throw new BadRequestException('Could not retrieve recordings');
    }

    return {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }

  // ── Student: accessible recordings ────────────────────────

  async getRecordingsForStudent(userId: string, topicId?: string) {
    const cacheKey = this.redisCache.key('recordings', 'flat', userId, topicId ?? 'all');
    return this.redisCache.wrap(cacheKey, 300, async () => {
      return this.fetchRecordingsForStudent(userId, topicId);
    });
  }

  private async fetchRecordingsForStudent(userId: string, topicId?: string) {
    const { data: batchMemberships } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const batchIds = (batchMemberships ?? []).map((b: any) => b.batch_id);

    if (batchIds.length === 0) {
      return [];
    }

    const { data: accessRecords } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('recording_id')
      .in('batch_id', batchIds);

    const recordingIds = [
      ...new Set((accessRecords ?? []).map((r: any) => r.recording_id)),
    ];

    if (recordingIds.length === 0) {
      return [];
    }

    let recordingsQuery = this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('id, title, description, topic_id, sort_order, status, created_at, topics(name)')
      .in('id', recordingIds)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true });

    if (topicId) {
      recordingsQuery = recordingsQuery.eq('topic_id', topicId);
    }

    const { data: recordings } = await recordingsQuery;

    if (!recordings || recordings.length === 0) {
      return [];
    }

    const recordingIdList = recordings.map((v: any) => v.id);
    const { data: progress } = await this.supabaseService.client
      .from(TABLES.VIDEO_PROGRESS)
      .select('video_id, watched_seconds, completed, last_watched_at')
      .in('video_id', recordingIdList)
      .eq('user_id', userId);

    const progressMap = new Map(
      (progress ?? []).map((p: any) => [p.video_id, p]),
    );

    return recordings.map((recording: any) => ({
      ...recording,
      progress: progressMap.get(recording.id) ?? {
        watched_seconds: 0,
        completed: false,
        last_watched_at: null,
      },
    }));
  }

  // ── Student: grouped recordings by batch → section ────────

  async getMyRecordingsGrouped(userId: string) {
    const cacheKey = this.redisCache.key('recordings', 'grouped', userId);
    return this.redisCache.wrap(cacheKey, 300, async () => {
      return this.fetchMyRecordingsGrouped(userId);
    });
  }

  private async fetchMyRecordingsGrouped(userId: string) {
    const { data: batchMemberships } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const userBatchIds = (batchMemberships ?? []).map((b: any) => b.batch_id);
    if (userBatchIds.length === 0) return [];

    const { data: batches } = await this.supabaseService.client
      .from(TABLES.BATCHES)
      .select('id, name')
      .in('id', userBatchIds);

    const batchMap = new Map((batches ?? []).map((b: any) => [b.id, b.name]));

    const { data: accessRecords } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('recording_id, batch_id')
      .in('batch_id', userBatchIds);

    const recordingIds = [...new Set((accessRecords ?? []).map((r: any) => r.recording_id))];
    if (recordingIds.length === 0) return [];

    const { data: recordings } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('id, title, description, mux_playback_id, duration_seconds, sort_order, status, created_at')
      .in('id', recordingIds)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true });

    if (!recordings || recordings.length === 0) return [];

    const recordingIdList = recordings.map((r: any) => r.id);

    const { data: curriculum } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('batch_id, content_id, category_name, sort_order, is_published, title_override')
      .eq('content_type', 'recording')
      .in('content_id', recordingIdList)
      .in('batch_id', userBatchIds)
      .eq('is_published', true);

    const { data: progress } = await this.supabaseService.client
      .from(TABLES.VIDEO_PROGRESS)
      .select('video_id, watched_seconds, completed, last_watched_at')
      .in('video_id', recordingIdList)
      .eq('user_id', userId);

    const progressMap = new Map(
      (progress ?? []).map((p: any) => [p.video_id, p]),
    );

    const curriculumByBatch = new Map<string, Map<string, any[]>>();
    for (const c of curriculum ?? []) {
      const bId = (c as any).batch_id;
      const section = (c as any).category_name ?? 'Uncategorized';
      if (!curriculumByBatch.has(bId)) {
        curriculumByBatch.set(bId, new Map());
      }
      const sections = curriculumByBatch.get(bId)!;
      if (!sections.has(section)) {
        sections.set(section, []);
      }
      sections.get(section)!.push(c);
    }

    const accessByRecording = new Map<string, Set<string>>();
    for (const a of accessRecords ?? []) {
      const recId = (a as any).recording_id;
      if (!accessByRecording.has(recId)) {
        accessByRecording.set(recId, new Set());
      }
      accessByRecording.get(recId)!.add((a as any).batch_id);
    }

    const result: any[] = [];
    for (const batchId of userBatchIds) {
      const batchName = batchMap.get(batchId) ?? 'Unknown Batch';
      const sections = curriculumByBatch.get(batchId);

      const recordingsInBatch = (accessRecords ?? [])
        .filter((a: any) => a.batch_id === batchId)
        .map((a: any) => a.recording_id);

      if (sections) {
        const sectionArr: any[] = [];
        for (const [sectionName, items] of sections) {
          const recordingsInSection = items
            .map((item: any) => {
              const rec = recordings.find((r: any) => r.id === item.content_id);
              if (!rec || !recordingsInBatch.includes(rec.id)) return null;
              const prog = progressMap.get(rec.id);
              return {
                id: rec.id,
                title: item.title_override ?? rec.title,
                description: rec.description,
                muxPlaybackId: rec.mux_playback_id,
                durationSeconds: rec.duration_seconds,
                sortOrder: item.sort_order ?? rec.sort_order,
                createdAt: rec.created_at,
                progress: prog
                  ? { watchedSeconds: prog.watched_seconds, completed: prog.completed, lastWatchedAt: prog.last_watched_at }
                  : { watchedSeconds: 0, completed: false, lastWatchedAt: null },
              };
            })
            .filter(Boolean);
          if (recordingsInSection.length > 0) {
            sectionArr.push({ sectionName, recordings: recordingsInSection });
          }
        }
        sectionArr.sort((a, b) => a.sectionName?.localeCompare(b.sectionName ?? '') ?? 0);
        result.push({ batchId, batchName, sections: sectionArr });
      } else {
        const uncategorized = recordings
          .filter((r: any) => recordingsInBatch.includes(r.id))
          .map((r: any) => {
            const prog = progressMap.get(r.id);
            return {
              id: r.id,
              title: r.title,
              description: r.description,
              muxPlaybackId: r.mux_playback_id,
              durationSeconds: r.duration_seconds,
              sortOrder: r.sort_order,
              createdAt: r.created_at,
              progress: prog
                ? { watchedSeconds: prog.watched_seconds, completed: prog.completed, lastWatchedAt: prog.last_watched_at }
                : { watchedSeconds: 0, completed: false, lastWatchedAt: null },
            };
          });
        if (uncategorized.length > 0) {
          result.push({ batchId, batchName, sections: [{ sectionName: null, recordings: uncategorized }] });
        }
      }
    }

    return result;
  }

  // ── Playback ──────────────────────────────────────────────

  private async validateAccess(recordingId: string, userId: string): Promise<void> {
    const { data: recording } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('status')
      .eq('id', recordingId)
      .single();

    if (!recording) throw new NotFoundException('Recording not found');
    if (recording.status !== 'ready') throw new BadRequestException('Recording is not ready for playback yet');

    const { data: userBatches } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const userBatchIds = (userBatches ?? []).map((b: any) => b.batch_id);
    if (userBatchIds.length === 0) {
      this.logger.warn(`validateAccess: user ${userId} has no batch assignments`);
      throw new ForbiddenException('You do not have access to this recording');
    }

    this.logger.debug('validateAccess', {
      recordingId,
      userId,
      userBatchIds,
    });

    // Check primary access via recording_batches
    const { data: accessRecords } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('batch_id')
      .eq('recording_id', recordingId)
      .in('batch_id', userBatchIds);

    if (accessRecords && accessRecords.length > 0) {
      this.logger.debug('validateAccess: access granted via recording_batches', {
        recordingId, userId, matchedBatchIds: accessRecords.map((r: any) => r.batch_id),
      });
      return;
    }

    this.logger.warn('validateAccess: access DENIED', {
      recordingId, userId, userBatchIds,
    });
    throw new ForbiddenException('You do not have access to this recording');
  }

  async authorizePlayback(recordingId: string, userId: string, deviceId?: string, ip?: string) {
    await this.validateAccess(recordingId, userId);
    return this.playbackGuard.authorize(userId, recordingId, deviceId, ip);
  }

  async getPlaybackUrl(recordingId: string, userId: string, token: string, deviceId?: string, ip?: string) {
    await this.validateAccess(recordingId, userId);

    const { data: recording } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('mux_playback_id')
      .eq('id', recordingId)
      .single();

    if (!recording?.mux_playback_id) {
      throw new BadRequestException('Recording has no playback ID configured');
    }

    return this.playbackGuard.getSignedUrl(
      token,
      recording.mux_playback_id,
      userId,
      recordingId,
      deviceId,
      ip,
    );
  }

  // ── Progress ──────────────────────────────────────────────

  async updateProgress(
    userId: string,
    recordingId: string,
    dto: UpdateVideoProgressDto,
  ) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.VIDEO_PROGRESS)
      .upsert(
        {
          user_id: userId,
          video_id: recordingId,
          watched_seconds: dto.watchedSeconds,
          completed: dto.completed ?? false,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update progress: ${error.message}`);
      throw new BadRequestException('Failed to update progress');
    }

    return data;
  }

  // ── Batch Recordings (classroom) ──────────────────────────

  async getBatchRecordings(batchId: string, userId: string) {
    const { data: membership } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId)
      .eq('batch_id', batchId)
      .maybeSingle();

    if (!membership) {
      throw new ForbiddenException('You do not have access to this batch');
    }

    const { data: links } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('recording_id')
      .eq('batch_id', batchId);

    const recordingIds = (links ?? []).map((l: any) => l.recording_id);

    if (recordingIds.length === 0) {
      return [];
    }

    const { data: recordings } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('id, title, description, duration_seconds, status, created_at, sort_order')
      .in('id', recordingIds)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true });

    return (recordings ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      duration: v.duration_seconds,
      status: v.status,
      createdAt: v.created_at,
    }));
  }

  private async autoCreateCurriculumEntries(recordingId: string, dto: CreateRecordingDto) {
    const categoryName = dto.categoryName || 'General';
    const moduleName = dto.moduleName || null;
    const isPublished = dto.isPublished ?? true;

    const entries = dto.batchIds.map((batchId) => ({
      batch_id: batchId,
      content_id: recordingId,
      content_type: 'recording',
      category_name: categoryName,
      module_name: moduleName,
      title_override: dto.titleOverride ?? null,
      sort_order: 0,
      is_published: isPublished,
    }));

    const { error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .upsert(entries, { onConflict: 'batch_id,content_id,content_type' });

    if (error) {
      this.logger.warn(`Failed to auto-create curriculum entries for recording ${recordingId}: ${error.message}`);
    }
  }
}
