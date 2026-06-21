import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsDateString, Min, Max, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class TestQuestionInput {
  @IsUUID()
  questionBankId: string;

  @IsNumber()
  @Min(1)
  marks: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMark?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsBoolean()
  isCompulsory?: boolean;
}

class TestSectionInput {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

class BatchAssignment {
  @IsUUID()
  batchId: string;
}

export class CreateTestDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  durationMinutes?: number;

  @IsNumber()
  @Min(1)
  totalMarks: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @IsOptional()
  @IsBoolean()
  showResultImmediately?: boolean;

  @IsOptional()
  @IsBoolean()
  negativeMarking?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  negativePerQuestion?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestSectionInput)
  sections?: TestSectionInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestQuestionInput)
  questions?: TestQuestionInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAssignment)
  batches?: BatchAssignment[];
}
