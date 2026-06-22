import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsObject,
} from 'class-validator';

export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsOptional()
  @IsString()
  @IsIn(['debug', 'info', 'warning', 'error', 'critical'])
  severity?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
