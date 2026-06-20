import {
  Injectable,
  BadRequestException,
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
    const webinar = await this.zoomService.createWebinar({
      topic: dto.title,
      startTime: dto.startTime,
      durationMinutes: 60,
    });

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

    if (error || !session) {
      this.logger.error(`Failed to save session: ${error?.message}`);
      throw new BadRequestException('Failed to create session');
    }

    const mappings = dto.batchIds.map((batchId) => ({
      session_id: session.id,
      batch_id: batchId,
    }));

    const { error: mapError } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCH_MAPPINGS)
      .insert(mappings);

    if (mapError) {
      this.logger.error(`Failed to link batches: ${mapError.message}`);
    }

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

  async remove(id: string): Promise<{ deleted: boolean }> {
    const { error } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete session ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete session');
    }

    return { deleted: true };
  }
}
