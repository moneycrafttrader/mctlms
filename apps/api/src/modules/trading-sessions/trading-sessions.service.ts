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
        batch_id: dto.batchId,
        zoom_meeting_id: webinar.webinarId,
        start_time: dto.startTime,
        title: dto.title,
        is_live: false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to save session: ${error.message}`);
      throw new BadRequestException('Failed to create session');
    }

    return {
      ...session,
      joinUrl: webinar.joinUrl,
      startUrl: webinar.startUrl,
    };
  }

  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .select('*, batches!inner(name)')
      .order('start_time', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch sessions: ${error.message}`);
      throw new BadRequestException('Could not retrieve sessions');
    }

    return (data ?? []).map((s: any) => ({
      id: s.id,
      batch_id: s.batch_id,
      batchName: s.batches?.name ?? '',
      zoom_meeting_id: s.zoom_meeting_id,
      start_time: s.start_time,
      title: s.title,
      is_live: s.is_live,
      created_at: s.created_at,
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
