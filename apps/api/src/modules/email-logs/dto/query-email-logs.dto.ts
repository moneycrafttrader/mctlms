import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryEmailLogsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'sent', 'failed', 'retrying'])
  status?: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  recipientSearch?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
