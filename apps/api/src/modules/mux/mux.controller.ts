/*
 * Mux controller — webhook endpoint for Mux event notifications
 *
 * Why this controller exists:
 *   - Receives HTTP callbacks from Mux when video events happen (asset ready, upload linked).
 *   - MUST be @Public() because Mux has no way to send a JWT token.
 *   - Verifies the webhook signature before processing any event.
 *   - Always returns 200 — never throw errors to Mux or it will retry.
 *
 * A junior should know:
 *   - The raw body is needed for signature verification (HMAC signs the exact payload).
 *   - Only two event types are handled: video.asset.ready and video.upload.asset_created.
 *   - Unknown events are logged and ignored.
 */
import { Controller, Post, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { MuxService } from './mux.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';
import { Public } from '../../common/decorators/public.decorator';

@Controller('mux')
export class MuxController {
  private readonly logger = new Logger(MuxController.name);

  constructor(
    private readonly muxService: MuxService,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * POST /mux/webhook
   *
   * Mux calls this when video processing events happen.
   * We verify the signature, then process the event.
   */
  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    // Extract signature header
    const muxSignature = req.headers['mux-signature'] as string;
    if (!muxSignature) {
      this.logger.warn('Missing mux-signature header');
      return { message: 'ok' };
    }

    // Get raw body (reconstructed from parsed JSON)
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    try {
      this.muxService.verifyWebhookSignature(rawBody, muxSignature);
    } catch {
      this.logger.warn('Mux webhook signature verification failed');
      return { message: 'ok' };
    }

    const event = req.body as {
      type: string;
      object?: { id: string };
      data?: Record<string, unknown>;
    };

    switch (event.type) {
      // ── video.asset.ready ──────────────────────────────────
      // Mux finished processing a video asset — update status to 'ready'
      case 'video.asset.ready': {
        const assetId = event.object?.id;
        const duration = (event.data?.duration as number) ?? 0;

        if (assetId) {
          await this.muxService.handleAssetReady(assetId, duration);
        }
        break;
      }

      // ── video.upload.asset_created ─────────────────────────
      // A direct upload has been processed into an asset — link the asset ID
      case 'video.upload.asset_created': {
        const uploadId = event.object?.id;
        const assetId = (event.data?.asset_id as string) ?? '';

        if (uploadId && assetId) {
          // Get playback ID from the asset
          const playbackId = (event.data?.playback_ids as any)?.[0]?.id ?? '';

          await this.supabaseService.client
            .from(TABLES.VIDEOS)
            .update({
              mux_asset_id: assetId,
              mux_playback_id: playbackId,
              status: 'processing',
            })
            .eq('mux_upload_id', uploadId);

          this.logger.log(`Upload ${uploadId} linked to asset ${assetId}`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled Mux event: ${event.type}`);
    }

    return { message: 'ok' };
  }
}
