import { IsOptional, IsString, IsInt, IsBoolean, MaxLength, IsIn } from 'class-validator';

export class UpdateCurriculumItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  categoryName?: string;

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
  @MaxLength(200)
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
