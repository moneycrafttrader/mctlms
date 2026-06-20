/*
 * Mux module — video processing and streaming integration
 *
 * Why this module exists:
 *   - Groups all Mux-related code (API client, webhook handler) in one place.
 *   - Exports MuxService so VideosModule can create upload URLs and signed playback URLs.
 *   - SupabaseService is globally available — no need to import explicitly.
 *
 * A junior should know:
 *   - MuxService handles direct uploads, URL imports, and signed playback JWT generation.
 *   - MuxController receives webhooks from Mux when videos finish processing.
 *   - NEVER generate raw playback URLs — always use getSignedPlaybackUrl().
 */
import { Module } from '@nestjs/common';
import { MuxController } from './mux.controller';
import { MuxService } from './mux.service';

@Module({
  controllers: [MuxController],
  providers: [MuxService],
  exports: [MuxService],
})
export class MuxModule {}
