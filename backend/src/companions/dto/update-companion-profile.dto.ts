import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { ServiceType } from '../companion-profile.entity';

export class UpdateCompanionProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profilePhotoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  hourlyRatePaisa?: number;

  @IsOptional()
  @IsArray()
  serviceAreaCentre?: [number, number];

  @IsOptional()
  @IsNumber()
  @Min(1)
  serviceAreaRadiusKm?: number;

  @IsOptional()
  @IsBoolean()
  isAvailableNow?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  services?: ServiceType[];
}
