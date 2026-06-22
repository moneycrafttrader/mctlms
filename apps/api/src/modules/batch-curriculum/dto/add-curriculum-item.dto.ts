import { IsString, IsUUID, IsOptional, IsInt, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class AddCurriculumItemDto {
  @IsUUID('4', { message: 'recordingId must be a valid UUID.' })
  recordingId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  categoryName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  moduleName?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
