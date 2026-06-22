import { IsOptional, IsString, IsUUID, IsIn, IsInt, Min, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class StartAttemptDto {
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

class AnswerInput {
  @IsUUID()
  questionId: string;

  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'numerical', 'short_answer', 'long_answer', 'image_upload', 'image_based'])
  questionType: string;

  @IsOptional()
  answer?: any;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentQuestionIndex?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeRemainingSeconds?: number;
}

export class SaveAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'numerical', 'short_answer', 'long_answer', 'image_upload', 'image_based'])
  questionType: string;

  @IsOptional()
  answer?: any;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentQuestionIndex?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeRemainingSeconds?: number;
}

class SubmitAnswerInput {
  @IsUUID()
  questionId: string;

  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'numerical', 'short_answer', 'long_answer', 'image_upload', 'image_based'])
  questionType: string;

  @IsOptional()
  answer?: any;
}

export class SubmitAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerInput)
  answers: SubmitAnswerInput[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeRemainingSeconds?: number;
}
