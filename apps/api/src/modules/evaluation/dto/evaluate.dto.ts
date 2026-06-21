import { IsUUID, IsNumber, IsOptional, IsString, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EvaluateAnswerDto {
  @IsUUID()
  answerId: string;

  @IsNumber()
  @Min(0)
  marksAwarded: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class SubmitReviewDto {
  @IsNumber()
  @Min(0)
  marksAwarded: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class ReviewSubmissionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluateAnswerDto)
  evaluations: EvaluateAnswerDto[];

  @IsOptional()
  @IsString()
  teacherFeedback?: string;
}
