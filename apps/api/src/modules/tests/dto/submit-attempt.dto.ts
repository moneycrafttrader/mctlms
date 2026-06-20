import { IsString, IsArray } from 'class-validator';

export class SubmitAttemptDto {
  @IsString()
  studentId: string;

  @IsArray()
  answers: unknown[];
}
