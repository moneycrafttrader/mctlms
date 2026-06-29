import { IsString, IsUUID, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchCurriculumAssignment {
  @IsUUID('4')
  batchId: string;

  @IsString()
  @IsOptional()
  sectionName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  assigned?: boolean;
}

export class UpdateBatchCurriculumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCurriculumAssignment)
  assignments: BatchCurriculumAssignment[];
}
