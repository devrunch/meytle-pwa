import {
  IsString, IsEnum, IsInt, IsBoolean, IsOptional,
  Min, IsNumber, IsDateString, Max,
} from 'class-validator';
import { CompanionStatus } from '../../companions/companion-profile.entity';

export class AdminUpdateCompanionDto {
  @IsEnum(CompanionStatus)
  @IsOptional()
  profileStatus?: CompanionStatus;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  hourlyRatePaisa?: number;

  @IsBoolean()
  @IsOptional()
  isAvailableNow?: boolean;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  serviceAreaRadiusKm?: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  serviceAreaLat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  serviceAreaLng?: number;

  @IsBoolean()
  @IsOptional()
  identityVerifiedByAdmin?: boolean;

  @IsBoolean()
  @IsOptional()
  stripePayoutsEnabled?: boolean;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  ratingAvg?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  ratingCount?: number;
}
