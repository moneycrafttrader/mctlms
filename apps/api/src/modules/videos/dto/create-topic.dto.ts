/*
 * DTO for creating a new topic (video category)
 *
 * Why this DTO exists:
 *   - Topics group videos into logical categories (e.g. "Chapter 1: Introduction").
 *   - sortOrder controls display order on the frontend.
 *
 * A junior should know:
 *   - sortOrder defaults to 0 if not provided — lower numbers appear first.
 *   - topicId references the topic this video belongs to (null if uncategorised).
 */
import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateTopicDto {
  /** Display name, e.g. "Chapter 1: Introduction" */
  @IsString()
  @MinLength(2, { message: 'Topic name must be at least 2 characters' })
  name: string;

  /** Optional description of what this topic covers */
  @IsString()
  @IsOptional()
  description?: string;

  /** Display order (lower = appears first) */
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
