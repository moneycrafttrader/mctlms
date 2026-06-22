import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';

export class TrackMetricDto {
  @IsString()
  @IsNotEmpty()
  metricName: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsObject()
  tags?: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;
}
