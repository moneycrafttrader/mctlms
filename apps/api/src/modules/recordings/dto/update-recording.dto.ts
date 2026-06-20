import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class UpdateRecordingDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID('4')
  @IsOptional()
  topicId?: string | null;
}
