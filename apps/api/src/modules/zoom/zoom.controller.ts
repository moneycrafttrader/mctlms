/*
 * Zoom controller — webhook endpoint + SDK signature generation
 */
import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { ZoomService } from './zoom.service';
import { ZoomWebhookHandler } from './zoom-webhook.handler';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';
import { Public } from '../../common/decorators/public.decorator';
import { CreateSignatureDto } from './dto/create-signature.dto';

@Controller('zoom')
export class ZoomController {
  private readonly logger = new Logger(ZoomController.name);

  constructor(
    private readonly zoomService: ZoomService,
    private readonly zoomWebhookHandler: ZoomWebhookHandler,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /zoom/signature
   *
   * Generates a time-limited HMAC signature for the Zoom Meeting SDK.
   * Only accessible to authenticated users with batch access to the session.
   *
   * Steps:
   *   1. Verify the user is authenticated (JWT guard handles this)
   *   2. Look up the session by zoom_meeting_id
   *   3. Verify the user belongs to a batch assigned to this session
   *   4. Generate and return the SDK signature
   */
  @Post('signature')
  async createSignature(
    @Body() dto: CreateSignatureDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Look up session by Zoom meeting number
    const { data: sessions, error: sessionError } = await this.supabaseService.client
      .from(TABLES.SESSIONS)
      .select('id, is_live, start_time')
      .eq('zoom_meeting_id', dto.meetingNumber)
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      throw new NotFoundException('Session not found');
    }

    const session = sessions[0];

    if (!session.is_live) {
      throw new ForbiddenException('Session is not live');
    }

    // Verify user has batch access to this session
    const { data: userBatches } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const userBatchIds = (userBatches ?? []).map((b: any) => b.batch_id);

    if (userBatchIds.length > 0) {
      const { data: accessRecords } = await this.supabaseService.client
        .from(TABLES.SESSION_BATCH_MAPPINGS)
        .select('batch_id')
        .eq('session_id', session.id)
        .in('batch_id', userBatchIds);

      if (!accessRecords || accessRecords.length === 0) {
        throw new ForbiddenException('You do not have access to this session');
      }
    }

    // Generate SDK signature
    const { signature, sdkKey } = this.zoomService.generateSignature(
      dto.meetingNumber,
      dto.role,
    );

    return {
      signature,
      sdkKey,
      meetingNumber: dto.meetingNumber,
      role: dto.role,
    };
  }

  /**
   * POST /zoom/webhook
   *
   * Zoom calls this endpoint for all events (joins, leaves, recordings).
   * Always returns 200 OK immediately so Zoom doesn't disable the URL.
   */
  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    // ── endpoint.url_validation (Zoom dashboard URL challenge) ──
    // Zoom sends this once when setting up the webhook URL in the
    // Marketplace dashboard.  It carries no standard signature headers.
    const eventType = req.body?.event as string;
    if (eventType === 'endpoint.url_validation') {
      const plainToken = req.body?.payload?.plainToken as string;
      const secret = this.configService.get<string>('ZOOM_WEBHOOK_SECRET') ?? '';
      const hash = crypto
        .createHmac('sha256', secret)
        .update(plainToken)
        .digest('hex');
      return { plainToken, encryptedToken: hash };
    }

    const signature =
      (req.headers['x-zm-signature'] as string) || '';
    const timestamp =
      (req.headers['x-zm-request-timestamp'] as string) || '';

    const rawBody = JSON.stringify(req.body);

    try {
      this.zoomService.verifyWebhookSignature(rawBody, signature, timestamp);
    } catch {
      this.logger.warn('Zoom webhook signature verification failed');
      return { message: 'ok' };
    }

    const payload = req.body;

    // Log participant joins for attendance tracking
    if (eventType === 'webinar.participant_joined') {
      const participant = payload?.object?.participant;
      const meetingId = payload?.object?.id;
      this.logger.log(
        `Participant joined — email: ${participant?.user_email}, meeting: ${meetingId}`,
      );
    }

    this.zoomWebhookHandler
      .handle(eventType, payload, this.supabaseService.client)
      .catch((err) =>
        this.logger.error(`Webhook handler error: ${err.message}`),
      );

    return { message: 'ok' };
  }
}
