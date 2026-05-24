import {
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { ServiceType } from '../../companions/companion-profile.entity';

export class CreateBookingDto {
  @IsString()
  companionId: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsDateString()
  bookedStart: string;

  @IsInt()
  @IsIn([60, 120, 180, 240])
  bookedDurationMinutes: number;

  // [lng, lat]
  @IsArray()
  meetingSpot: [number, number];

  @IsString()
  meetingSpotText: string;

  @IsBoolean()
  @IsOptional()
  isCustomRequest?: boolean;

  @IsString()
  @IsOptional()
  customNote?: string;

  // Stripe Payment Method ID — passed from frontend Stripe.js
  @IsString()
  paymentMethodId: string;
}
