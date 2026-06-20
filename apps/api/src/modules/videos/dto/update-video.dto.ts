/*
 * DTO for updating video metadata
 *
 * Why this DTO exists:
 *   - Admins can change title, description, and topic assignment of existing videos.
 *   - All fields are optional — only provided fields are updated (PATCH semantics).
 *
 * A junior should know:
 *   - PATCH /videos/:id accepts this body.
 *   - Setting topicId to null clears the topic assignment.
 */
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string | null;
}
