import { IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StaffDetailsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
