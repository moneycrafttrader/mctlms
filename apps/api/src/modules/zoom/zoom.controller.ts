/*
 * Zoom controller — webhook endpoint for Zoom notifications
 *
 * Why this controller exists:
 *   - Receives HTTP callbacks from Zoom when events happen (participant joins,
 *     recording ready, etc.).
 *   - MUST be @Public() because Zoom has no way to send a JWT token.
 *   - Verifies the webhook signature before processing any event.
 *   - Always returns 200 { message: 'ok' } — never return 500 to Zoom or it will retry.
 *
 * A junior should know:
 *   - The raw body is needed for signature verification (HMAC signs the exact payload).
 *   - In production, add a middleware that stores `req.rawBody` before JSON parsing
 *     (see main.ts rawBody option). For now, we reconstruct from the parsed body.
 *   - We pass supabase.client to the webhook handler so it can write attendance records.
 */
import { Controller, Post, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ZoomService } from './zoom.service';
import { ZoomWebhookHandler } from './zoom-webhook.handler';
import { SupabaseService } from '../../common/services/supabase.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('zoom')
export class ZoomController {
  private readonly logger = new Logger(ZoomController.name);

  constructor(
    private readonly zoomService: ZoomService,
    private readonly zoomWebhookHandler: ZoomWebhookHandler,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * POST /zoom/webhook
   *
   * Zoom calls this endpoint when events happen (joins, leaves, recordings).
   * We verify the signature, then process the event.
   *
   * Always return { message: 'ok' } — never throw errors to Zoom.
   */
  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    // ── Extract signature headers ──────────────────────────────
    const signature =
      (req.headers['x-zm-signature'] as string) || '';
    const timestamp =
      (req.headers['x-zm-request-timestamp'] as string) || '';

    // ── Get raw body for signature verification ────────────────
    // The request body has already been parsed by Express JSON middleware.
    // For production signature verification, add a middleware that stores
    // the raw Buffer before parsing (see NestJS raw-body approach).
    // Here we reconstruct from the parsed object as a reasonable fallback.
    const rawBody = JSON.stringify(req.body);

    // ── Verify signature ───────────────────────────────────────
    try {
      this.zoomService.verifyWebhookSignature(rawBody, signature, timestamp);
    } catch {
      // Signature verification failed — log and return ok to avoid leaking info
      this.logger.warn('Zoom webhook signature verification failed');
      return { message: 'ok' };
    }

    // ── Process the event ──────────────────────────────────────
    const event = req.body.event as string;
    const payload = req.body;

    // Fire and forget — don't await so we respond immediately
    this.zoomWebhookHandler
      .handle(event, payload, this.supabaseService.client)
      .catch((err) =>
        this.logger.error(`Webhook handler error: ${err.message}`),
      );

    // Always acknowledge immediately
    return { message: 'ok' };
  }
}
