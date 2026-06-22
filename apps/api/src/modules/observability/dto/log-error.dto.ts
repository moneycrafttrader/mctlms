import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsObject,
} from 'class-validator';

export class LogErrorDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  errorType: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['debug', 'info', 'warning', 'error', 'critical'])
  severity: string;

  @IsOptional()
  @IsString()
  stackTrace?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
