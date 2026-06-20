import {
  IsString,
  IsDateString,
  IsArray,
  IsUUID,
  ArrayMinSize,
  MinLength,
} from 'class-validator';

export class CreateTradingSessionDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsDateString()
  startTime: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  batchIds: string[];
}
