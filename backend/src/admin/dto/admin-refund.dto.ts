import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class AdminRefundDto {
  // Partial refund amount in paisa; omit for full refund
  @IsInt()
  @Min(1)
  @IsOptional()
  amountPaisa?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
