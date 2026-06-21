import { IsString, IsOptional, IsIn, IsObject, IsUUID, IsBoolean, IsArray } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'numerical', 'short_answer', 'long_answer', 'image_upload', 'image_based'])
  questionType: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'numerical', 'short_answer', 'long_answer', 'image_upload', 'image_based'])
  questionType?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class BulkImportQuestionDto {
  @IsArray()
  questions: CreateQuestionDto[];
}
