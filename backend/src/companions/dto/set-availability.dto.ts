import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsString, Matches } from 'class-validator';

class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  fromTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  toTime: string;
}

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
