import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpsertTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  htmlTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
