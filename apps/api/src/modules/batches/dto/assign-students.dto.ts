/*
 * DTO for enrolling students into a batch
 *
 * Why this DTO exists:
 *   - Validates that every student ID is a valid UUID v4 before the service processes it.
 *   - Prevents SQL/REST errors from malformed IDs reaching the database.
 *
 * A junior should know:
 *   - studentIds is an array of user UUIDs — these must be valid student accounts.
 *   - @IsUUID('4') ensures the string is a valid version-4 UUID format.
 */
import { IsArray, IsUUID } from 'class-validator';

export class AssignStudentsDto {
  /** Array of student user IDs to enroll in the batch */
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each student ID must be a valid UUID' })
  studentIds: string[];
}
