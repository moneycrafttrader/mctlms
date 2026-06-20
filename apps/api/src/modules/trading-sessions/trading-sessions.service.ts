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
}
