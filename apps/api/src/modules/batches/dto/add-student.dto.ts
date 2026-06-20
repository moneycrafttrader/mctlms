import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
