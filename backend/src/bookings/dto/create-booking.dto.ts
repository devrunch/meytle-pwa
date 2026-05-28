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

  // Stripe PaymentIntent ID — created via POST /bookings/prepare-payment, confirmed client-side
  @IsString()
  paymentIntentId: string;

  // Tip in paisa (custom requests only)
  @IsInt()
  @Min(0)
  @IsOptional()
  tipPaisa?: number;
}
