/*
 * DTO for the login endpoint — validates request body BEFORE it reaches the service
 *
 * Why this DTO exists:
 *   - The global ValidationPipe (configured in main.ts) checks these decorators
 *     automatically and returns a 400 error with a clear message if validation fails.
 *   - Without this, the service would have to manually check every field.
 *
 * A junior should know:
 *   - `@IsEmail()` rejects values that aren't valid email addresses.
 *   - `@MinLength(6)` rejects passwords shorter than 6 characters.
 *   - Custom `message` values make the error response more user-friendly.
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
