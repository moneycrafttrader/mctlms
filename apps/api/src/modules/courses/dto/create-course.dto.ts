import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @IsString({ message: 'Course name must be text.' })
  @MinLength(3, { message: 'Course name must be at least 3 characters.' })
  @MaxLength(150, { message: 'Course name cannot exceed 150 characters.' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid date (YYYY-MM-DD).' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid date (YYYY-MM-DD).' })
  endDate?: string;
}
