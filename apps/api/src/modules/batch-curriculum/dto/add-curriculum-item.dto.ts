import { IsString, IsUUID, IsOptional, IsInt, IsBoolean, MinLength, MaxLength, IsIn } from 'class-validator';

export class AddCurriculumItemDto {
  @IsOptional()
  @IsUUID('4', { message: 'contentId must be a valid UUID.' })
  contentId?: string;

  @IsString()
  @IsIn(['recording', 'test', 'session', 'pdf'], { message: 'contentType must be one of: recording, test, session, pdf.' })
  contentType!: string;

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

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pdfTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleOverride?: string;
}
