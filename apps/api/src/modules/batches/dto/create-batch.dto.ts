import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { BatchScheduleType } from '@lms/shared-types';

export class CreateBatchDto {
  @IsUUID('4', { message: 'courseId must be a valid UUID.' })
  courseId!: string;

  @IsString()
  @MinLength(2, { message: 'Batch name must be at least 2 characters.' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(BatchScheduleType, {
    message: 'scheduleType must be one of: weekday, weekend, custom.',
  })
  scheduleType?: BatchScheduleType;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid date (YYYY-MM-DD).' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid date (YYYY-MM-DD).' })
  endDate?: string;
}
