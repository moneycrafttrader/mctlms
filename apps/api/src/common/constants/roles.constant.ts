/*
 * Centralised role names — import from here, never hardcode strings
 *
 * Why this file exists:
 *   - If we ever rename a role (e.g. 'teacher' -> 'instructor') we change ONE file.
 *   - The `as const` assertion lets TypeScript infer the literal union type.
 *
 * A junior should know:
 *   - Use `ROLES.ADMIN` instead of the string 'admin'.
 *   - For type annotations use the `Role` type alias.
 */
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
