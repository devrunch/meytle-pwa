import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{10,14}$/, { message: 'phone must be a valid number' })
  phone?: string;

  @IsDateString()
  dateOfBirth: string;
}
