import { IsEnum, IsInt, IsString, IsOptional, Min } from 'class-validator';
import { BookingStatus, CancelledByParty } from '../../bookings/booking.entity';

export class AdminUpdateBookingDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  companionPayoutPaisa?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  platformFeePaisa?: number;

  @IsEnum(CancelledByParty)
  @IsOptional()
  cancelledBy?: CancelledByParty;

  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
