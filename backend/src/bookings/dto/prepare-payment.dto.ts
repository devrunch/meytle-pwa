import { IsString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

export class PreparePaymentDto {
  @IsString()
  companionId: string;

  @IsInt()
  @Min(60)
  bookedDurationMinutes: number;

  @IsBoolean()
  @IsOptional()
  isCustomRequest?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  tipPaisa?: number;
}
