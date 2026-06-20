/*
 * DTOs for manual attendance marking
 *
 * Why these DTOs exist:
 *   - ManualAttendanceEntryDto validates each student's attendance status individually.
 *   - ManualAttendanceDto wraps entries together with the session ID so the service
 *     can upsert all records in one go.
 *   - @ValidateNested + @Type() tells class-validator to validate nested objects.
 *
 * A junior should know:
 *   - ManualAttendanceEntryDto uses @IsEnum(AttendanceStatus) from @lms/shared-types
 *     so only 'present', 'absent', or 'late' are accepted.
 *   - The @Type() decorator from class-transformer is required for nest validation
 *     to work — don't forget it.
 */
import { IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@lms/shared-types';

/** A single student's attendance entry */
export class ManualAttendanceEntryDto {
  /** The student's user UUID */
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /** Whether they were present, absent, or late */
  @IsEnum(AttendanceStatus, { message: 'Status must be: present, absent, or late' })
  status: AttendanceStatus;
}

/** Request body for manually marking attendance for a session */
export class ManualAttendanceDto {
  /** The session UUID */
  @IsUUID('4', { message: 'Session ID must be a valid UUID' })
  sessionId: string;

  /** Array of student attendance entries */
  @IsArray({ message: 'Entries must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ManualAttendanceEntryDto)
  entries: ManualAttendanceEntryDto[];
}
