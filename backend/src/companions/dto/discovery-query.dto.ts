import { IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ServiceType } from '../companion-profile.entity';

export class DiscoveryQueryDto {
  @IsOptional()
  @IsEnum(ServiceType)
  service?: ServiceType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  availableNow?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
