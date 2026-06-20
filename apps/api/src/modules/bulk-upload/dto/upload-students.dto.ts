import { IsOptional, IsUUID } from 'class-validator';

export class UploadStudentsDto {
  @IsOptional()
  @IsUUID('4', { message: 'batchId must be a valid UUID' })
  batchId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'courseId must be a valid UUID' })
  courseId?: string;
}
