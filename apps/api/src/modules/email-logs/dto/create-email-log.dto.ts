import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateEmailLogDto {
  @IsString()
  @IsNotEmpty()
  recipientEmail: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateType?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
