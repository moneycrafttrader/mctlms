/*
 * Zoom webhook event handler — processes Zoom notifications
 *
 * Why this class exists:
 *   - Keeps webhook event logic separate from the Zoom API client (zoom.service.ts).
 *   - Each event type has its own case in the switch statement with clear comments.
 *   - Uses SupabaseClient directly because webhooks are high-volume and we want
 *     minimal indirection.
 *
 * A junior should know:
 *   - This is called by ZoomController after signature verification passes.
 *   - The `supabase` parameter is passed in by the controller, not injected.
 *   - We always return even if something fails — never throw in here, just log errors.
 *   - Zoom will retry failed webhooks, so duplicate events are handled via upsert.
 */
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '../../common/constants/tables.constant';

@Injectable()
export class ZoomWebhookHandler {
  private readonly logger = new Logger(ZoomWebhookHandler.name);

  /**
   * Process a verified Zoom webhook event.
   *
   * @param event - The event type string (e.g. "webinar.participant_joined")
   * @param payload - The full webhook payload from Zoom
   * @param supabase - Initialised Supabase client for database operations
   */
  async handle(
    event: string,
    payload: any,
    supabase: SupabaseClient,
  ): Promise<void> {
    try {
      switch (event) {
        // ── participant_joined ──────────────────────────────────
        // A student entered the Zoom webinar. Upsert an attendance record
        // with status 'present' so we know they showed up.
        case 'webinar.participant_joined': {
          const participant = payload.object.participant;
          const webinarId = payload.object.id.toString();

          // Find the session by Zoom webinar ID
          const { data: sessions } = await supabase
            .from(TABLES.LIVE_SESSIONS)
            .select('id')
            .eq('zoom_webinar_id', webinarId)
            .limit(1);

          if (!sessions || sessions.length === 0) {
            this.logger.warn(`No session found for webinar ${webinarId}`);
            return;
          }

          const sessionId = sessions[0].id;

          // Find user by email (what Zoom sends in the participant object)
          const { data: users } = await supabase
            .from(TABLES.PROFILES)
            .select('id')
            .eq('email', participant.email)
            .limit(1);

          if (!users || users.length === 0) {
            this.logger.warn(`No user found for email ${participant.email}`);
            return;
          }

          // Upsert attendance record (student may have already been marked present)
          await supabase.from(TABLES.ATTENDANCE).upsert(
            {
              session_id: sessionId,
              user_id: users[0].id,
              joined_at: new Date().toISOString(),
              status: 'present',
            },
            { onConflict: 'session_id,user_id' },
          );

          this.logger.log(`Attendance marked: user ${users[0].id} joined session ${sessionId}`);
          break;
        }

        // ── participant_left ────────────────────────────────────
        // A student left the webinar. Update their attendance record with
        // the leave time and calculate how long they stayed.
        case 'webinar.participant_left': {
          const participant = payload.object.participant;
          const webinarId = payload.object.id.toString();

          const { data: sessions } = await supabase
            .from(TABLES.LIVE_SESSIONS)
            .select('id')
            .eq('zoom_webinar_id', webinarId)
            .limit(1);

          if (!sessions || sessions.length === 0) return;

          const sessionId = sessions[0].id;

          const { data: users } = await supabase
            .from(TABLES.PROFILES)
            .select('id')
            .eq('email', participant.email)
            .limit(1);

          if (!users || users.length === 0) return;

          // Get the existing attendance record to find join_time
          const { data: attendance } = await supabase
            .from(TABLES.ATTENDANCE)
            .select('joined_at')
            .eq('session_id', sessionId)
            .eq('user_id', users[0].id)
            .limit(1);

          if (attendance && attendance.length > 0 && attendance[0].joined_at) {
            const joinedAt = new Date(attendance[0].joined_at).getTime();
            const leftAt = Date.now();
            const durationSeconds = Math.floor((leftAt - joinedAt) / 1000);

            await supabase
              .from(TABLES.ATTENDANCE)
              .update({
                duration_seconds: durationSeconds,
              })
              .eq('session_id', sessionId)
              .eq('user_id', users[0].id);
          }

          break;
        }

        // ── webinar.ended ───────────────────────────────────────
        // The webinar finished. Update the session status to 'ended' and
        // mark all unregistered students as absent.
        case 'webinar.ended': {
          const webinarId = payload.object.id.toString();

          await supabase
            .from(TABLES.LIVE_SESSIONS)
            .update({ status: 'ended' })
            .eq('zoom_webinar_id', webinarId);

          // Mark students who never joined as absent (using a Supabase RPC call)
          const { data: sessions } = await supabase
            .from(TABLES.LIVE_SESSIONS)
            .select('id')
            .eq('zoom_webinar_id', webinarId)
            .limit(1);

          if (sessions && sessions.length > 0) {
            // RPC or manual query to mark unregistered students as absent
            const { error: rpcError } = await supabase.rpc(
              'mark_absent_for_session',
              { session_id: sessions[0].id },
            );

            if (rpcError) {
              this.logger.warn(`Failed to mark absent students: ${rpcError.message}`);
            }
          }

          this.logger.log(`Session ended for webinar ${webinarId}`);
          break;
        }

        // ── recording.completed ─────────────────────────────────
        // A Zoom cloud recording is ready. Find the MP4 file and add it
        // to the upload queue for Mux processing.
        case 'recording.completed': {
          const record = payload.object;
          const recordingFiles = record.recording_files || [];

          // Find the MP4 file (Zoom provides multiple formats)
          const mp4File = recordingFiles.find(
            (file: any) => file.file_type === 'MP4',
          );

          if (!mp4File) {
            this.logger.warn('No MP4 file found in recording.completed event');
            return;
          }

          // Look up session by Zoom webinar ID
          const webinarId = record.id?.toString();
          let sessionId: string | null = null;
          if (webinarId) {
            const { data: sessions } = await supabase
              .from(TABLES.LIVE_SESSIONS)
              .select('id')
              .eq('zoom_webinar_id', webinarId)
              .limit(1);
            if (sessions && sessions.length > 0) {
              sessionId = sessions[0].id;
            }
          }

          // Insert into upload queue
          await supabase.from(TABLES.UPLOAD_QUEUE).insert({
            session_id: sessionId,
            zoom_download_url: mp4File.download_url,
            zoom_url_expires_at: new Date(
              Date.now() + 20 * 60 * 60 * 1000, // 20 hours (Zoom links expire in 24h)
            ).toISOString(),
            status: 'pending',
          });

          this.logger.log(`Recording queued for Mux upload: ${record.topic}`);
          break;
        }

        // ── default ─────────────────────────────────────────────
        // Unknown event type — log and ignore
        default:
          this.logger.log(`Unhandled Zoom webhook event: ${event}`);
          break;
      }
    } catch (error: any) {
      // Never throw from a webhook handler — Zoom will retry and we might
      // end up processing duplicate events
      this.logger.error(
        `Error processing Zoom webhook event ${event}: ${error.message}`,
      );
    }
  }
}
