import {
  IsString,
  IsDateString,
  IsArray,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  MinLength,
} from 'class-validator';

export class CreateTradingSessionDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  batchIds: string[];
}
