import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';

export class AdjustAccountDto {
  @ApiPropertyOptional({ description: 'Amount to add/subtract from locked amount' })
  @IsOptional()
  @IsInt()
  lockedDelta?: number;

  @ApiPropertyOptional({ description: 'Amount to add/subtract from advance amount' })
  @IsOptional()
  @IsInt()
  advanceDelta?: number;
}