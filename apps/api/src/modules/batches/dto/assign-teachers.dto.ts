/*
 * DTO for assigning teachers to a batch
 *
 * Why this DTO exists:
 *   - Same pattern as AssignStudentsDto — validates teacher UUIDs before processing.
 *
 * A junior should know:
 *   - teacherIds must reference existing users with role = 'teacher'.
 *   - Each ID must be a valid UUID v4 format.
 */
import { IsArray, IsUUID } from 'class-validator';

export class AssignTeachersDto {
  /** Array of teacher user IDs to assign to the batch */
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each teacher ID must be a valid UUID' })
  teacherIds: string[];
}
