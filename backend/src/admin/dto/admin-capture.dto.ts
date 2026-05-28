import { IsInt, Min, IsOptional } from 'class-validator';

export class AdminCaptureDto {
  // Override capture amount in paisa; omit to capture full authorized amount
  @IsInt()
  @Min(1)
  @IsOptional()
  amountPaisa?: number;
}
