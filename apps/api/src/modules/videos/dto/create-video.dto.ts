/*
 * DTO for creating a new video
 *
 * Why this DTO exists:
 *   - Validates input before reaching the service layer.
 *   - batchIds determines which batches can see this video — cross-batch assignment.
 *   - Empty batchIds means no one can see the video yet (admin must assign later).
 *
 * A junior should know:
 *   - The actual video file is uploaded directly to Mux by the frontend using the
 *     upload URL returned by the service. The video never touches our server.
 *   - sortOrder controls the order videos appear within a topic.
 *   - batchIds is optional — if empty, the video exists but is invisible to students.
 */
import { IsString, IsArray, IsUUID, IsInt, IsOptional, MinLength } from 'class-validator';

export class CreateVideoDto {
  /** Display title visible to students */
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  title: string;

  /** Optional description shown below the video player */
  @IsString()
  @IsOptional()
  description?: string;

  /** The topic this video belongs to (null if uncategorised) */
  @IsUUID('4')
  @IsOptional()
  topicId?: string;

  /** Display order within the topic (lower = appears first) */
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  /** Which batches can see this video. Empty = no one can see it yet. */
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each batch ID must be a valid UUID' })
  @IsOptional()
  batchIds?: string[];
}
