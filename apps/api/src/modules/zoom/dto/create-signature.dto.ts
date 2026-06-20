import { IsString, IsNumber } from 'class-validator';

export class CreateSignatureDto {
  @IsString()
  meetingNumber: string;

  @IsNumber()
  role: number;
}
