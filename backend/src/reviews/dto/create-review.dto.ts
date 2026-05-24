import { IsString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  bookingId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  starRating: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;
}
