import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{10,14}$/, { message: 'phone must be a valid number' })
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
