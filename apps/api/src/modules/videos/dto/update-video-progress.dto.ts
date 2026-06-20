/*
 * DTO for updating video watch progress
 *
 * Why this DTO exists:
 *   - Called by the video player every ~30 seconds to save the student's position
 *     so they can resume watching from where they left off.
 *   - The completed flag is set when the student reaches the end of the video.
 *
 * A junior should know:
 *   - watchedSeconds is the cumulative time watched, not the current position.
 *   - completed = true means the student finished the video.
 *   - last_watched_at is set automatically by the service to now().
 */
import { IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

export class UpdateVideoProgressDto {
  /** Total seconds the student has watched so far */
  @IsInt({ message: 'watchedSeconds must be a whole number' })
  @Min(0, { message: 'watchedSeconds cannot be negative' })
  watchedSeconds: number;

  /** Whether the student has reached the end of the video */
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
