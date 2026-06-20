import {
  IsString,
  IsDateString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateTradingSessionDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsDateString()
  startTime: string;

  @IsUUID('4')
  batchId: string;
}
