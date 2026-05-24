import { IsEmail, IsString, MinLength, IsDateString } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  fullName: string;

  @IsDateString()
  dateOfBirth: string;
}
