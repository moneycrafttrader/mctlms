import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  ArrayMinSize,
  MinLength,
} from 'class-validator';

export class CreateRecordingDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  batchIds: string[];
}
