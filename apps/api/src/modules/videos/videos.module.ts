/*
 * Videos module — video library, topics, and batch access control
 *
 * Why this module exists:
 *   - Groups all video-related code (topics, videos, progress, batch access) in one place.
 *   - Imports MuxModule so it can create upload URLs and signed playback URLs.
 *   - Exports VideosService for other modules that need video data.
 *
 * A junior should know:
 *   - Topics = categories. Videos = individual files with batch access control.
 *   - MuxService handles direct uploads, URL imports, and signed JWT generation.
 *   - Students only see videos their batch has access to.
 */
import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { MuxModule } from '../mux/mux.module';
import { PlaybackModule } from '../playback/playback.module';

@Module({
  imports: [MuxModule, PlaybackModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
