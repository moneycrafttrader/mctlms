import { IsOptional, IsString } from 'class-validator';

export class StartAttemptDto {
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class SaveAnswerDto {
  questionId: string;
  questionType: string;
  answer: any;
  currentQuestionIndex?: number;
  timeRemainingSeconds?: number;
}

export class SubmitAttemptDto {
  answers: { questionId: string; questionType: string; answer: any }[];
  timeRemainingSeconds?: number;
}
