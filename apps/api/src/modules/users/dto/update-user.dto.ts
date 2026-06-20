/*
 * DTO for updating an existing user — all fields are optional
 *
 * Why this DTO exists:
 *   - Uses PartialType so the frontend only sends the fields it wants to change.
 *   - Adds `isActive` for account suspension (separate from editing profile fields).
 *
 * A junior should know:
 *   - Every field is optional — PATCH semantics (only send what changed).
 *   - isActive = false triggers force-logout via AuthService.
 *   - If you don't include a field, it won't be changed in the database.
 */
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  /** Set to false to suspend the account (user is logged out immediately) */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
