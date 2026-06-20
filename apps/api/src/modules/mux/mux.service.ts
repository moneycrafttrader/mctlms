/*
 * Mux service — the ONLY place that talks to the Mux API
 *
 * Why this service exists:
 *   - All video operations (upload URL creation, asset import, signed playback URLs)
 *     go through this service — never import @mux/mux-node directly elsewhere.
 *   - Key security rule: signed playback URLs are generated per-user per-request.
 *     No student ever gets a raw Mux URL — all playback goes through
 *     getSignedPlaybackUrl() which returns a time-limited JWT.
 *   - Webhook signature verification ensures only genuine Mux events are processed.
 *
 * A junior should know:
 *   - Mux client is lazy-initialised so missing credentials don't crash startup in dev.
 *   - Signed URLs expire in 4 hours (default) — short enough that sharing a link
 *     outside the platform is impractical.
 *   - The private key in env vars often has literal \n characters that need replacing
 *     with actual newlines (standard .env limitation).
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mux from '@mux/mux-node';
import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

@Injectable()
export class MuxService {
  private readonly logger = new Logger(MuxService.name);
  private _muxClient: Mux | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  //  muxClient (private lazy getter)
  // ──────────────────────────────────────────────────────────────

  /**
   * Lazy-initialise the Mux client so we don't fail on startup if Mux credentials
   * are missing in development.
   */
  private get muxClient(): Mux {
    if (!this._muxClient) {
      const tokenId = this.configService.get<string>('MUX_TOKEN_ID');
      const tokenSecret = this.configService.get<string>('MUX_TOKEN_SECRET');

      if (!tokenId || !tokenSecret) {
        throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set in environment variables');
      }

      this._muxClient = new Mux({ tokenId, tokenSecret });
    }
    return this._muxClient;
  }

  // ──────────────────────────────────────────────────────────────
  //  createUploadUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a direct upload URL for the frontend to upload a video file directly
   * to Mux (the video never touches our server).
   *
   * Steps:
   *   1. Call Mux API to create a direct upload with signed playback policy
   *   2. Return the upload URL and upload ID to the frontend
   */
  async createUploadUrl(
    title: string,
    topicId: string,
  ): Promise<{ uploadUrl: string; uploadId: string }> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const upload = await this.muxClient.video.uploads.create({
      cors_origin: frontendUrl,
      new_asset_settings: {
        playback_policy: ['signed'],
        passthrough: JSON.stringify({ title, topicId }),
      },
    });

    return {
      uploadUrl: upload.url,
      uploadId: upload.id,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  createDirectUploadUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a direct upload URL for the frontend to PUT a video file
   * directly to Mux. Unlike createUploadUrl (used in the admin create flow),
   * this method accepts minimal metadata and is designed for the manual
   * upload flow initiated from the Recordings page.
   *
   * Steps:
   *   1. Call Mux API Video.Uploads.create with cors_origin set to '*'
   *      so the browser can PUT from any origin in development.
   *   2. Return the upload URL and upload ID.
   */
  async createDirectUploadUrl(
    title: string,
  ): Promise<{ uploadUrl: string; uploadId: string }> {
    const upload = await this.muxClient.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['signed'],
        passthrough: JSON.stringify({ title }),
      },
    });

    return {
      uploadUrl: upload.url,
      uploadId: upload.id,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  uploadFromUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Import a video from a URL (used by the recording upload cron job to pull
   * Zoom cloud recordings into Mux).
   *
   * Steps:
   *   1. Tell Mux to fetch the video from the provided download URL
   *   2. Insert a record into TABLES.RECORDINGS with status 'processing'
   *   3. Return the Mux asset ID
   */
  async uploadFromUrl(
    sessionId: string,
    downloadUrl: string,
    title: string,
  ): Promise<string> {
    const asset = await this.muxClient.video.assets.create({
      input: [{ url: downloadUrl }],
      playback_policy: ['signed'],
      passthrough: JSON.stringify({ sessionId, title }),
    });

    return asset.id;
  }

  // ──────────────────────────────────────────────────────────────
  //  handleAssetReady
  // ──────────────────────────────────────────────────────────────

  /**
   * Update DB records when Mux confirms a video has finished processing.
   *
   * Mux calls our webhook when a video finishes processing — we update status
   * so students can watch.
   *
   * Steps:
   *   1. Update TABLES.RECORDINGS with status 'ready' and duration
   *   2. Also update TABLES.VIDEOS if there's a matching record
   */
  async handleAssetReady(muxAssetId: string, durationSeconds: number): Promise<void> {
    await this.supabaseService.client
      .from(TABLES.RECORDINGS)
      .update({
        status: 'ready',
        duration_seconds: durationSeconds,
      })
      .eq('mux_asset_id', muxAssetId);

    await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .update({
        status: 'ready',
        duration_seconds: durationSeconds,
      })
      .eq('mux_asset_id', muxAssetId);

    this.logger.log(`Asset ${muxAssetId} is ready (${durationSeconds}s)`);
  }

  // ──────────────────────────────────────────────────────────────
  //  getSignedPlaybackUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Generate a time-limited signed playback URL for a single user.
   *
   * 4-hour expiry means a student can't bookmark the URL and share it.
   * Each page load generates a fresh token tied to their session.
   *
   * Steps:
   *   1. Get signing key ID and private key from environment
   *   2. Fix escaped newlines in the private key (common .env issue)
   *   3. Sign a JWT with RS256 using the Mux signing key
   *   4. Return the full playback URL with the signed token
   */
  async getSignedPlaybackUrl(
    playbackId: string,
    userId: string,
    expiresInSeconds = 14400,
  ): Promise<string> {
    const keyId = this.configService.get<string>('MUX_SIGNING_KEY_ID');
    let privateKey = this.configService.get<string>('MUX_SIGNING_PRIVATE_KEY');

    if (!keyId || !privateKey) {
      throw new Error(
        'MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY must be set in environment variables',
      );
    }

    // Replace literal \n with actual newlines (env vars flatten newlines)
    privateKey = privateKey.replace(/\\n/g, '\n');

    const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
    const payload = {
      sub: playbackId,
      aud: 'v', // 'v' for video playback
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };

    const token = this.signJwt(header, payload, privateKey);

    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
  }

  // ──────────────────────────────────────────────────────────────
  //  getSignedThumbnailUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Generate a signed thumbnail URL for a video.
   *
   * Same signing process as playback URLs but with audience 't' (thumbnail).
   */
  async getSignedThumbnailUrl(playbackId: string): Promise<string> {
    const keyId = this.configService.get<string>('MUX_SIGNING_KEY_ID');
    let privateKey = this.configService.get<string>('MUX_SIGNING_PRIVATE_KEY');

    if (!keyId || !privateKey) {
      throw new Error('MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY must be set');
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
    const payload = {
      sub: playbackId,
      aud: 't',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = this.signJwt(header, payload, privateKey);

    return `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${token}`;
  }

  // ──────────────────────────────────────────────────────────────
  //  signJwt (private helper)
  // ──────────────────────────────────────────────────────────────

  /**
   * Manually sign a JWT with RS256 using a private key.
   *
   * We use Node's built-in crypto module instead of jsonwebtoken to avoid
   * an extra dependency for this specific use case.
   */
  private signJwt(
    header: Record<string, string>,
    payload: Record<string, any>,
    privateKey: string,
  ): string {
    const b64Encode = (obj: any) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const headerEncoded = b64Encode(header);
    const payloadEncoded = b64Encode(payload);
    const message = `${headerEncoded}.${payloadEncoded}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(message);
    const signature = signer
      .sign(privateKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${signature}`;
  }

  // ──────────────────────────────────────────────────────────────
  //  verifyWebhookSignature
  // ──────────────────────────────────────────────────────────────

  /**
   * Verify that a webhook notification actually came from Mux.
   *
   * Mux sends signatures in the format: `t=timestamp,v1=hash`
   * We recompute the hash and compare.
   *
   * Steps:
   *   1. Parse the Mux signature header to extract timestamp and hash
   *   2. Compute HMAC-SHA256 of `${timestamp}.${rawBody}`
   *   3. Compare with constant-time comparison
   */
  verifyWebhookSignature(rawBody: string, muxSignature: string): void {
    const webhookSecret = this.configService.get<string>('MUX_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('MUX_WEBHOOK_SECRET must be set in environment variables');
    }

    // Parse header: t=timestamp,v1=hash
    const parts = muxSignature.split(',');
    const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1] ?? '';
    const hash = parts.find((p) => p.startsWith('v1='))?.split('=')[1] ?? '';

    if (!timestamp || !hash) {
      throw new BadRequestException('Invalid Mux webhook signature format');
    }

    const message = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(message)
      .digest('hex');

    // Constant-time comparison
    if (expectedHash.length !== hash.length) {
      throw new BadRequestException('Invalid Mux webhook signature');
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(hash),
    );

    if (!valid) {
      throw new BadRequestException('Invalid Mux webhook signature');
    }
  }
}
