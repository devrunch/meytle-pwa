import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { ServiceType } from '../companion-profile.entity';

export class CreateCompanionProfileDto {
  @IsString()
  @MinLength(1)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profilePhotoUrl?: string;

  @IsNumber()
  @Min(50000)
  hourlyRatePaisa: number;

  // GeoJSON point: [lng, lat]
  @IsArray()
  serviceAreaCentre: [number, number];

  @IsOptional()
  @IsNumber()
  @Min(1)
  serviceAreaRadiusKm?: number;

  @IsArray()
  @IsEnum(ServiceType, { each: true })
  services: ServiceType[];
}
