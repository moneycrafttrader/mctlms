import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { ZoomService } from '../zoom/zoom.service';
import { TABLES } from '../../common/constants/tables.constant';
import { CreateTradingSessionDto } from './dto/create-trading-session.dto';

@Injectable()
export class TradingSessionsService {
  private readonly logger = new Logger(TradingSessionsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly zoomService: ZoomService,
  ) {}

  async create(dto: CreateTradingSessionDto) {
    if (!dto.startTime) {
      throw new BadRequestException('startTime is required');
    }
    if (!dto.batchIds || dto.batchIds.length === 0) {
      throw new BadRequestException('At least one batch must be selected');
    }

    this.logger.log(`Creating session "${dto.title}" for batches [${dto.batchIds.join(', ')}]`);

    // ── 1. Create Zoom webinar ─────────────────────────────────
    let webinar: { webinarId: string; joinUrl: string; startUrl: string };
    try {
      webinar = await this.zoomService.createWebinar({
        topic: dto.title,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes || 180,
      });
      this.logger.log(`Zoom webinar created: ID=${webinar.webinarId}, joinUrl=${webinar.joinUrl}`);
    } catch (err: any) {
      this.logger.error(`Zoom API call failed: ${err.message}`, err.stack);
      throw new BadRequestException(`Zoom API error: ${err.message}`);
    }

    // ── 2. Insert session record (no batch_id — M:N lives in session_batch_mappings) ──
    const { data: session, error } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .insert({
        zoom_meeting_id: webinar.webinarId,
        start_time: dto.startTime,
        title: dto.title,
        is_live: false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`DB insert into ${TABLES.SESSIONS} failed: ${error.message}`, error);
      throw new BadRequestException(`Failed to save session: ${error.message}`);
    }
    if (!session) {
      this.logger.error('DB insert returned null session (no error)');
      throw new BadRequestException('Failed to create session record');
    }
    this.logger.log(`Session saved: ID=${session.id}`);

    // ── 3. Link session to batches ─────────────────────────────
    const mappings = dto.batchIds.map((batchId) => ({
      session_id: session.id,
      batch_id: batchId,
    }));

    const { error: mapError } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCH_MAPPINGS)
      .insert(mappings);

    if (mapError) {
      this.logger.error(`Failed to link batches: ${mapError.message}`, mapError);
      throw new BadRequestException(`Failed to assign batches to session: ${mapError.message}`);
    }
    this.logger.log(`Linked ${dto.batchIds.length} batch(es) to session ${session.id}`);

    // ── 4. Fetch batch names for response ──────────────────────
    const { data: batchNames } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCH_MAPPINGS)
      .select('batches!inner(name)')
      .eq('session_id', session.id);

    return {
      id: session.id,
      zoom_meeting_id: session.zoom_meeting_id,
      start_time: session.start_time,
      title: session.title,
      is_live: session.is_live,
      created_at: session.created_at,
      updated_at: session.updated_at,
      batchIds: dto.batchIds,
      batchNames: (batchNames ?? []).map((b: any) => b.batches.name),
      joinUrl: webinar.joinUrl,
      startUrl: webinar.startUrl,
    };
  }

  async findAll() {
    const { data: sessions, error } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .select('*')
      .order('start_time', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch sessions: ${error.message}`);
      throw new BadRequestException('Could not retrieve sessions');
    }

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map((s: any) => s.id);

    const { data: mappings } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCH_MAPPINGS)
      .select('session_id, batches!inner(name)')
      .in('session_id', sessionIds);

    const batchMap = new Map<string, string[]>();
    for (const m of mappings ?? []) {
      const prev = batchMap.get((m as any).session_id) ?? [];
      prev.push((m as any).batches.name);
      batchMap.set((m as any).session_id, prev);
    }

    return (sessions ?? []).map((s: any) => ({
      id: s.id,
      zoom_meeting_id: s.zoom_meeting_id,
      start_time: s.start_time,
      title: s.title,
      is_live: s.is_live,
      created_at: s.created_at,
      updated_at: s.updated_at,
      batchNames: batchMap.get(s.id) ?? [],
    }));
  }

  async remove(id: string): Promise<{ success: boolean; deletedId: string }> {
    // ── 1. Fetch session to get zoom_meeting_id ────────────────
    const { data: session, error: fetchError } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .select('zoom_meeting_id')
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      throw new NotFoundException(`Session ${id} not found`);
    }

    // ── 2. Cancel the Zoom webinar (best-effort) ───────────────
    try {
      await this.zoomService.deleteWebinar(session.zoom_meeting_id);
    } catch (err: any) {
      this.logger.warn(
        `Failed to delete Zoom webinar ${session.zoom_meeting_id}: ${err.message}. Proceeding with DB cleanup.`,
      );
    }

    // ── 3. Remove junction rows (session_batch_mappings) ───────
    const { error: mapError } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCH_MAPPINGS)
      .delete()
      .eq('session_id', id);

    if (mapError) {
      this.logger.error(`Failed to delete mappings for session ${id}: ${mapError.message}`);
    }

    // ── 4. Delete the session record ───────────────────────────
    const { error: deleteError } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .delete()
      .eq('id', id);

    if (deleteError) {
      this.logger.error(`Failed to delete session ${id}: ${deleteError.message}`);
      throw new BadRequestException('Failed to delete session');
    }

    return { success: true, deletedId: id };
  }
}
