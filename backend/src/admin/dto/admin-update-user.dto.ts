import { IsString, IsEmail, IsEnum, IsArray, IsOptional, IsDateString } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class AdminUpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[];

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}
