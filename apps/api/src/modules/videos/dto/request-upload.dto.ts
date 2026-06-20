/*
 * DTO for requesting a Mux direct upload URL
 *
 * Why this DTO exists:
 *   - The manual upload flow only needs a title upfront.
 *   - Admin can assign topic and batches later via the Edit modal.
 *   - Keeps the barrier to upload low — just name the file.
 *
 * A junior should know:
 *   - The backend creates a Mux direct upload and inserts a DB record.
 *   - Once Mux finishes processing, the webhook updates the status to 'ready'.
 */
import { IsString, MinLength } from 'class-validator';

export class RequestUploadDto {
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  title: string;
}
