import { IsString, IsArray } from 'class-validator';

export class CreateTestDto {
  @IsString()
  title: string;

  @IsString()
  batchId: string;

  @IsArray()
  questions: unknown[];
}
