import {
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
  MinLength,
} from 'class-validator';

export class CreatePaymentPlanDto {
  @IsUUID('4', { message: 'studentId must be a valid UUID' })
  studentId: string;

  @IsUUID('4', { message: 'courseId must be a valid UUID' })
  courseId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'totalAmount must be a number with up to 2 decimal places' })
  @Min(0.01, { message: 'totalAmount must be at least 0.01' })
  totalAmount: number;

  @IsInt({ message: 'numberOfInstallments must be an integer' })
  @Min(1, { message: 'numberOfInstallments must be at least 1' })
  numberOfInstallments: number;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @IsOptional()
  @MinLength(1, { message: 'notes must not be empty' })
  notes?: string;
}
