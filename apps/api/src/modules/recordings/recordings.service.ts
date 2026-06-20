import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { MuxService } from '../mux/mux.service';
import { TABLES } from '../../common/constants/tables.constant';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { CreateTopicDto } from '../videos/dto/create-topic.dto';
import { RequestUploadDto } from '../videos/dto/request-upload.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { UpdateVideoProgressDto } from '../videos/dto/update-video-progress.dto';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly muxService: MuxService,
  ) {}

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
      this.logger.error(`Failed to link batches: ${linkError.message}`);
    }

    const { data: batchNames } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('batches!inner(name)')
      .eq('recording_id', recording.id);

    return {
      ...recording,
      batchIds: dto.batchIds,
      batchNames: (batchNames ?? []).map((b: any) => b.batches.name),
    };
  }

  async findAll() {
    const { data: recordings, error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch recordings: ${error.message}`);
      throw new BadRequestException('Could not retrieve recordings');
    }

    if (!recordings || recordings.length === 0) return [];

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

    return (recordings ?? []).map((r: any) => ({
      ...r,
      batchNames: batchMap.get(r.id) ?? [],
    }));
  }

  async createRecordingWithUpload(dto: CreateRecordingDto) {
    const { uploadUrl, uploadId } = await this.muxService.createUploadUrl(
      dto.title,
      '',
    );

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

    if (error) {
      this.logger.error(`Failed to create recording: ${error.message}`);
      throw new BadRequestException('Failed to create recording');
    }

    if (dto.batchIds && dto.batchIds.length > 0) {
      const batchRecords = dto.batchIds.map((batchId) => ({
        recording_id: recording.id,
        batch_id: batchId,
      }));

      await this.supabaseService.client
        .from(TABLES.RECORDING_BATCHES)
        .upsert(batchRecords, { onConflict: 'recording_id,batch_id' });
    }

    return { recording, uploadUrl };
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

    return { removedCount: batchIds.length };
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
      .select('id, mux_asset_id')
      .eq('id', id)
      .single();

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.mux_asset_id) {
      await this.muxService.deleteAsset(recording.mux_asset_id);
    }

    const { error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete recording ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete recording');
    }

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

  // ── Playback ──────────────────────────────────────────────

  async getPlaybackUrl(recordingId: string, userId: string) {
    const { data: recording, error } = await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .select('*')
      .eq('id', recordingId)
      .single();

    if (error || !recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.status !== 'ready') {
      throw new BadRequestException('Recording is not ready for playback yet');
    }

    const { data: userBatches } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const userBatchIds = (userBatches ?? []).map((b: any) => b.batch_id);

    if (userBatchIds.length > 0) {
      const { data: accessRecords } = await this.supabaseService.client
        .from(TABLES.RECORDING_BATCHES)
        .select('batch_id')
        .eq('recording_id', recordingId)
        .in('batch_id', userBatchIds);

      if (!accessRecords || accessRecords.length === 0) {
        throw new ForbiddenException('You do not have access to this recording');
      }
    }

    const [url, thumbnail] = await Promise.all([
      this.muxService.getSignedPlaybackUrl(recording.mux_playback_id, userId),
      this.muxService.getSignedThumbnailUrl(recording.mux_playback_id),
    ]);

    await this.supabaseService.client
      .from(TABLES.VIDEO_VIEWS)
      .insert({
        video_id: recordingId,
        user_id: userId,
        viewed_at: new Date().toISOString(),
      });

    return { url, thumbnail };
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

  async getBatchRecordings(batchId: string) {
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
      .select('id, title, description, mux_playback_id, duration_seconds, status, created_at, sort_order')
      .in('id', recordingIds)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true });

    return (recordings ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      muxPlaybackId: v.mux_playback_id,
      duration: v.duration_seconds,
      status: v.status,
      createdAt: v.created_at,
    }));
  }
}
