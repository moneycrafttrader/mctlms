import { IsOptional, IsString, IsInt, IsBoolean, MaxLength } from 'class-validator';

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
}
